// Trimmed port of Perfetto's ui/src/trace_processor/engine.ts (the
// EngineBase abstract class). Dropped relative to upstream: computeMetric,
// summarizeTrace, metatrace, the summarizer RPCs, SQL package registration,
// EngineProxy/tagging, and query logging — none of those are needed for a
// page that just parses a trace and runs ad-hoc SQL against it. What
// remains (parse, notifyEof, resetTraceProcessor, query) is the same
// request/response bookkeeping upstream uses, just talking the hand-rolled
// wire format in rpc_wire.ts instead of generated protobufjs bindings.

import {defer, type Deferred} from './deferred';
import {ensureExists} from './assert';
import {ProtoRingBuffer} from './proto_ring_buffer';
import {
  createQueryResult,
  type QueryResult,
  type WritableQueryResult,
} from './query_result';
import {
  TraceProcessorMethod as TPM,
  encodeAppendTraceData,
  encodeFinalizeTraceData,
  encodeQuery,
  encodeResetTraceProcessor,
  decodeRpcResponse,
} from './rpc_wire';

export abstract class EngineBase {
  private txSeqId = 0;
  private rxBuf = new ProtoRingBuffer();
  private pendingParses: Array<Deferred<void>> = [];
  private pendingEOFs: Array<Deferred<void>> = [];
  private pendingResets: Array<Deferred<void>> = [];
  private pendingQueries: Array<WritableQueryResult> = [];
  private _failed: string | undefined;

  // Sends proto-encoded TraceProcessorRpc bytes to the concrete engine
  // (postMessage to the wasm worker, in our case).
  abstract rpcSendRequestBytes(data: Uint8Array<ArrayBuffer>): void;

  // Called by the concrete engine when inbound bytes arrive (onmessage).
  onRpcResponseBytes(dataWillBeRetained: Uint8Array<ArrayBuffer>) {
    this.rxBuf.append(dataWillBeRetained);
    for (;;) {
      const msg = this.rxBuf.readMessage();
      if (msg === undefined) break;
      this.onRpcResponseMessage(msg);
    }
  }

  private onRpcResponseMessage(rpcMsgEncoded: Uint8Array<ArrayBuffer>) {
    const rpc = decodeRpcResponse(rpcMsgEncoded);

    if (rpc.fatalError !== undefined && rpc.fatalError.length > 0) {
      this._failed = rpc.fatalError;
      throw new Error(rpc.fatalError);
    }

    switch (rpc.response) {
      case TPM.TPM_APPEND_TRACE_DATA: {
        const pending = ensureExists(this.pendingParses.shift());
        if (rpc.error !== undefined) {
          pending.reject(new Error(rpc.error));
        } else {
          pending.resolve();
        }
        break;
      }
      case TPM.TPM_FINALIZE_TRACE_DATA: {
        const pending = ensureExists(this.pendingEOFs.shift());
        if (rpc.error !== undefined) {
          pending.reject(new Error(rpc.error));
        } else {
          pending.resolve();
        }
        break;
      }
      case TPM.TPM_RESET_TRACE_PROCESSOR:
        ensureExists(this.pendingResets.shift()).resolve();
        break;
      case TPM.TPM_QUERY_STREAMING: {
        const queryResultBytes = ensureExists(rpc.queryResultBytes);
        const pending = ensureExists(this.pendingQueries[0]);
        pending.appendResultBatch(queryResultBytes);
        if (pending.isComplete()) {
          this.pendingQueries.shift();
        }
        break;
      }
      default:
        console.warn('Unexpected TraceProcessor response:', rpc.response);
        break;
    }
  }

  // Push trace data into the engine. It auto-detects the trace type.
  parse(data: Uint8Array<ArrayBuffer>): Promise<void> {
    const asyncRes = defer<void>();
    this.pendingParses.push(asyncRes);
    this.rpcSendRequestBytes(encodeAppendTraceData(this.txSeqId++, data));
    return asyncRes;
  }

  // Notify the engine that we reached the end of the trace. Call after the
  // last parse().
  notifyEof(): Promise<void> {
    const asyncRes = defer<void>();
    this.pendingEOFs.push(asyncRes);
    this.rpcSendRequestBytes(encodeFinalizeTraceData(this.txSeqId++));
    return asyncRes;
  }

  // Creates the TraceProcessor instance (with default options). Must be
  // called once before the first parse().
  resetTraceProcessor(): Promise<void> {
    const asyncRes = defer<void>();
    this.pendingResets.push(asyncRes);
    this.rpcSendRequestBytes(encodeResetTraceProcessor(this.txSeqId++));
    return asyncRes;
  }

  // Issues a query and returns once all result rows have been received.
  // Rejects with a QueryError (see query_result.ts) if the query fails.
  async query(sqlQuery: string): Promise<QueryResult> {
    const result = createQueryResult({query: sqlQuery});
    this.pendingQueries.push(result);
    this.rpcSendRequestBytes(encodeQuery(this.txSeqId++, sqlQuery));
    return await result;
  }

  get failed(): string | undefined {
    return this._failed;
  }

  abstract dispose(): void;
}
