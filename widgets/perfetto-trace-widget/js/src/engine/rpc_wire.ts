// Hand-rolled wire encoding/decoding for the small subset of the
// TraceProcessor RPC protocol this package uses: append trace data,
// finalize, reset, and streaming query.
//
// Perfetto's own UI generates a full protobufjs static module from
// trace_processor.proto (via pbjs/pbts) and uses that for encoding/decoding.
// We deliberately don't: pulling in generated bindings would mean vendoring
// (and keeping in sync) a second build output on top of trace_processor.wasm
// itself. The wire format for the handful of messages we need is small and
// stable, so we encode/decode it directly with protobufjs's low-level
// Reader/Writer — the same primitives query_result.ts already needs for the
// streaming query result format, and the same technique Perfetto's own
// query_result.ts uses to hand-parse QueryResult.CellsBatch.
//
// Field numbers below are copied from
// protos/perfetto/trace_processor/trace_processor.proto
// (message TraceProcessorRpc / TraceProcessorRpcStream) in the pinned
// google/perfetto revision (see /vendor/PERFETTO_REV). If that revision is
// bumped and the wire format changes, these need to be re-checked against
// the new .proto source.

import protobuf from 'protobufjs/minimal';

export enum TraceProcessorMethod {
  TPM_UNSPECIFIED = 0,
  TPM_APPEND_TRACE_DATA = 1,
  TPM_FINALIZE_TRACE_DATA = 2,
  TPM_QUERY_STREAMING = 3,
  TPM_RESET_TRACE_PROCESSOR = 11,
}

// TraceProcessorRpc field numbers.
const F_SEQ = 1;
const F_REQUEST = 2;
const F_RESPONSE = 3;
const F_FATAL_ERROR = 5;
const F_APPEND_TRACE_DATA = 101; // bytes, request arg
const F_QUERY_ARGS = 103; // QueryArgs, request arg
const F_RESET_TRACE_PROCESSOR_ARGS = 107; // ResetTraceProcessorArgs, request arg
const F_APPEND_RESULT = 201; // AppendTraceDataResult, response arg
const F_QUERY_RESULT = 203; // QueryResult, response arg (raw passthrough)
const F_FINALIZE_DATA_RESULT = 212; // FinalizeDataResult, response arg

// QueryArgs field numbers.
const F_QUERY_ARGS_SQL = 1;

// AppendTraceDataResult / FinalizeDataResult error field numbers (these
// differ between the two messages).
const F_APPEND_RESULT_ERROR = 2;
const F_FINALIZE_RESULT_ERROR = 1;

function encodeStream(rpcBytes: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  // TraceProcessorRpcStream { repeated TraceProcessorRpc msg = 1; }
  // ProtoRingBuffer on the receiving end tokenizes messages by stripping
  // exactly this field-1 length-delimited envelope, so every request we
  // send must be wrapped in one (containing a single inner message).
  const w = new protobuf.Writer();
  w.uint32((1 << 3) | 2).bytes(rpcBytes);
  return w.finish() as Uint8Array<ArrayBuffer>;
}

export function encodeAppendTraceData(seq: number, data: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const w = new protobuf.Writer();
  w.uint32((F_SEQ << 3) | 0).int64(seq);
  w.uint32((F_REQUEST << 3) | 0).int32(TraceProcessorMethod.TPM_APPEND_TRACE_DATA);
  w.uint32((F_APPEND_TRACE_DATA << 3) | 2).bytes(data);
  return encodeStream(w.finish() as Uint8Array<ArrayBuffer>);
}

export function encodeFinalizeTraceData(seq: number): Uint8Array<ArrayBuffer> {
  const w = new protobuf.Writer();
  w.uint32((F_SEQ << 3) | 0).int64(seq);
  w.uint32((F_REQUEST << 3) | 0).int32(TraceProcessorMethod.TPM_FINALIZE_TRACE_DATA);
  return encodeStream(w.finish() as Uint8Array<ArrayBuffer>);
}

// Resets (creates) the TraceProcessor instance with default options. We
// don't expose any of the ResetTraceProcessorArgs config knobs (tokenize-only
// parsing, ftrace options, etc.) — an empty submessage means "use defaults",
// which is all this minimal engine needs.
export function encodeResetTraceProcessor(seq: number): Uint8Array<ArrayBuffer> {
  const w = new protobuf.Writer();
  w.uint32((F_SEQ << 3) | 0).int64(seq);
  w.uint32((F_REQUEST << 3) | 0).int32(
    TraceProcessorMethod.TPM_RESET_TRACE_PROCESSOR,
  );
  w.uint32((F_RESET_TRACE_PROCESSOR_ARGS << 3) | 2).fork().ldelim();
  return encodeStream(w.finish() as Uint8Array<ArrayBuffer>);
}

export function encodeQuery(seq: number, sql: string): Uint8Array<ArrayBuffer> {
  const w = new protobuf.Writer();
  w.uint32((F_SEQ << 3) | 0).int64(seq);
  w.uint32((F_REQUEST << 3) | 0).int32(TraceProcessorMethod.TPM_QUERY_STREAMING);
  w.uint32((F_QUERY_ARGS << 3) | 2).fork();
  w.uint32((F_QUERY_ARGS_SQL << 3) | 2).string(sql);
  w.ldelim();
  return encodeStream(w.finish() as Uint8Array<ArrayBuffer>);
}

export interface DecodedRpcResponse {
  response: TraceProcessorMethod | undefined;
  fatalError?: string;
  // Populated for TPM_APPEND_TRACE_DATA / TPM_FINALIZE_TRACE_DATA responses.
  error?: string;
  // Raw trace_processor.QueryResult submessage bytes for a
  // TPM_QUERY_STREAMING response, handed off to query_result.ts's own
  // streaming decoder rather than parsed here.
  queryResultBytes?: Uint8Array<ArrayBuffer>;
}

// Reads a nested message's single string error field (used for both
// AppendTraceDataResult.error and FinalizeDataResult.error, which live at
// different field numbers in their respective messages).
function readErrorField(
  reader: protobuf.Reader,
  end: number,
  fieldNo: number,
): string | undefined {
  let error: string | undefined;
  while (reader.pos < end) {
    const tag = reader.uint32();
    if (tag >>> 3 === fieldNo) {
      error = reader.string();
    } else {
      reader.skipType(tag & 7);
    }
  }
  return error !== undefined && error.length > 0 ? error : undefined;
}

// Decodes a single TraceProcessorRpc message (already stripped of its
// TraceProcessorRpcStream envelope by ProtoRingBuffer).
export function decodeRpcResponse(buf: Uint8Array<ArrayBuffer>): DecodedRpcResponse {
  const reader = protobuf.Reader.create(buf);
  const out: DecodedRpcResponse = {response: undefined};
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const fieldNo = tag >>> 3;
    switch (fieldNo) {
      case F_RESPONSE:
        out.response = reader.int32() as TraceProcessorMethod;
        break;
      case F_FATAL_ERROR:
        out.fatalError = reader.string();
        break;
      case F_APPEND_RESULT: {
        const len = reader.uint32();
        const end = reader.pos + len;
        out.error = readErrorField(reader, end, F_APPEND_RESULT_ERROR);
        reader.pos = end;
        break;
      }
      case F_FINALIZE_DATA_RESULT: {
        const len = reader.uint32();
        const end = reader.pos + len;
        out.error = readErrorField(reader, end, F_FINALIZE_RESULT_ERROR);
        reader.pos = end;
        break;
      }
      case F_QUERY_RESULT: {
        const len = reader.uint32();
        out.queryResultBytes = buf.subarray(reader.pos, reader.pos + len);
        reader.pos += len;
        break;
      }
      default:
        reader.skipType(tag & 7);
        break;
    }
  }
  return out;
}
