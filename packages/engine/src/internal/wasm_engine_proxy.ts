// Trimmed port of Perfetto's ui/src/trace_processor/wasm_engine_proxy.ts.
// Dropped relative to upstream: the memory64 wasm variant, and the
// "always keep a spare idle worker around" pre-warming optimization (that
// exists to hide worker-startup latency for the *next* trace a user opens —
// not needed when a page only ever loads one trace per session).

import {assertTrue} from './assert';
import {EngineBase} from './engine_base';

function assetUrl(name: string): string {
  return `${import.meta.env.BASE_URL}${name}`;
}

export class WasmEngineProxy extends EngineBase {
  private port: MessagePort;
  private worker: Worker;

  private constructor(port: MessagePort, worker: Worker) {
    super();
    this.port = port;
    this.worker = worker;
    this.port.onmessage = this.onMessage.bind(this);
  }

  static async create(): Promise<WasmEngineProxy> {
    const wasmModule = await WebAssembly.compileStreaming(
      fetch(assetUrl('trace_processor.wasm')),
    );
    const worker = new Worker(new URL('../worker.ts', import.meta.url), {
      type: 'module',
    });
    const channel = new MessageChannel();
    worker.postMessage(
      {
        port: channel.port1,
        wasmModule,
        wasmJsUrl: assetUrl('trace_processor.js'),
      },
      [channel.port1],
    );
    return new WasmEngineProxy(channel.port2, worker);
  }

  private onMessage(m: MessageEvent) {
    assertTrue(m.data instanceof Uint8Array);
    this.onRpcResponseBytes(m.data as Uint8Array<ArrayBuffer>);
  }

  rpcSendRequestBytes(data: Uint8Array<ArrayBuffer>): void {
    // No transfer list: the caller (rpc_wire.ts, via protobufjs) may reuse
    // its underlying buffer across encode calls, so transferring ownership
    // here would be unsafe.
    this.port.postMessage(data);
  }

  dispose() {
    this.worker.terminate();
  }
}
