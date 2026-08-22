// Worker entrypoint. Mirrors perfetto-wasm's packages/engine/src/worker.ts
// — see engine/README.md for why this is a copy, not a dependency.
//
// Bundled via Vite's `?worker&inline` import (see perfetto_engine.ts), so
// this never needs to be served as a separate file: anywidget's exported
// bundle (including the marimo html-wasm export target this widget is
// built for) only has to serve one JS file.

import {WasmBridge} from './engine/wasm_bridge';

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
