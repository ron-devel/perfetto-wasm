// Port of Perfetto's ui/src/trace_processor/proto_ring_buffer.ts (verbatim
// logic, only the import path changed). See the original for the detailed
// design rationale — this class tokenizes a byte stream of
// length-delimited protobuf messages (used for the TraceProcessor RPC wire
// protocol) out of possibly-fragmented postMessage() chunks.

import {assertTrue} from './assert';

const kGrowBytes = 128 * 1024;
const kMaxMsgSize = 1024 * 1024 * 1024;

export class ProtoRingBuffer {
  private buf = new Uint8Array(kGrowBytes);
  private fastpath?: Uint8Array<ArrayBuffer>;
  private rd = 0;
  private wr = 0;

  // The caller must call readMessage() after each append() call.
  append(data: Uint8Array<ArrayBuffer>) {
    assertTrue(this.wr <= this.buf.length);
    assertTrue(this.rd <= this.wr);

    if (this.rd === this.wr) {
      this.rd = this.wr = 0;
    }

    const dataLen = data.length;
    if (dataLen === 0) return;
    assertTrue(this.fastpath === undefined);
    if (this.rd === this.wr) {
      const msg = this.tryReadMessage(data, 0, dataLen);
      if (
        msg !== undefined &&
        msg.byteOffset + msg.length === data.byteOffset + dataLen
      ) {
        // Fastpath: avoid the extra buffer roundtrip when the underlying
        // stream preserves message atomicity (the common case).
        this.fastpath = msg;
        return;
      }
    }

    let avail = this.buf.length - this.wr;
    if (dataLen > avail) {
      this.buf.copyWithin(0, this.rd, this.wr);
      avail += this.rd;
      this.wr -= this.rd;
      this.rd = 0;
      if (dataLen > avail) {
        let newSize = this.buf.length;
        while (dataLen > newSize - this.wr) {
          newSize += kGrowBytes;
        }
        assertTrue(newSize <= kMaxMsgSize * 2);
        const newBuf = new Uint8Array(newSize);
        newBuf.set(this.buf);
        this.buf = newBuf;
      }
    }

    this.buf.set(data, this.wr);
    this.wr += dataLen;
  }

  // Tries to extract a message from the ring buffer. Returns undefined if
  // there is no message, or if the current message is still incomplete.
  // The caller is expected to call this in a loop until it returns
  // undefined (a single append() can yield more than one message).
  readMessage(): Uint8Array<ArrayBuffer> | undefined {
    if (this.fastpath !== undefined) {
      assertTrue(this.rd === this.wr);
      const msg = this.fastpath;
      this.fastpath = undefined;
      return msg;
    }
    assertTrue(this.rd <= this.wr);
    if (this.rd >= this.wr) {
      return undefined;
    }
    const msg = this.tryReadMessage(this.buf, this.rd, this.wr);
    if (msg === undefined) return undefined;
    assertTrue(msg.buffer === this.buf.buffer);
    assertTrue(this.buf.byteOffset === 0);
    this.rd = msg.byteOffset + msg.length;

    // Return a copy: |msg| is a view into the ring buffer we may overwrite
    // on the next append(), but callers (streaming query results) hold onto
    // the returned buffer.
    return msg.slice();
  }

  private tryReadMessage(
    data: Uint8Array<ArrayBuffer>,
    dataStart: number,
    dataEnd: number,
  ): Uint8Array<ArrayBuffer> | undefined {
    assertTrue(dataEnd <= data.length);
    let pos = dataStart;
    if (pos >= dataEnd) return undefined;
    let len = 0;

    // Assumes a one-byte, length-delimited field tag (true for the
    // TraceProcessorRpcStream.msg field we use to frame every message).
    const tag = data[pos++];
    if (tag >= 0x80 || (tag & 0x07) !== 2) {
      throw new Error(
        `RPC framing error, unexpected tag ${tag} @ offset ${pos - 1}`,
      );
    }

    for (let shift = 0; ; shift += 7) {
      if (pos >= dataEnd) {
        return undefined; // Not enough data to read the varint yet.
      }
      const val = data[pos++];
      len |= ((val & 0x7f) << shift) >>> 0;
      if (val < 0x80) break;
    }

    if (len >= kMaxMsgSize) {
      throw new Error(
        `RPC framing error, message too large (${len} > ${kMaxMsgSize})`,
      );
    }
    const end = pos + len;
    if (end > dataEnd) return undefined;

    // subarray() (not slice()): in the |fastpath| case we want to return the
    // original buffer pushed by append(); the slow-path readMessage() above
    // takes a copy before returning it.
    return data.subarray(pos, end);
  }
}
