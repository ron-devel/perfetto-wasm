// Worker entrypoint, spawned by internal/wasm_engine_proxy.ts. Mirrors
// Perfetto's ui/src/engine/index.ts.
//
// There are two message handlers here:
// 1. The Worker's own onmessage: the main thread posts {port, wasmModule,
//    wasmJsUrl} exactly once, right after spawning this worker.
// 2. The MessagePort handler (wired up inside WasmBridge.initialize): every
//    subsequent message is the TraceProcessor RPC binary pipe.

import {WasmBridge} from './internal/wasm_bridge';

const selfWorker = self as unknown as Worker;
const wasmBridge = new WasmBridge();

selfWorker.onmessage = (msg: MessageEvent) => {
  const data = msg.data as {
    port: MessagePort;
    wasmModule: WebAssembly.Module;
    wasmJsUrl: string;
  };
  void wasmBridge.initialize(data.port, data.wasmJsUrl, data.wasmModule);
};
