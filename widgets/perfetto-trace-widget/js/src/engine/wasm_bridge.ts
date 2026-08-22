// Trimmed port of Perfetto's ui/src/engine/wasm_bridge.ts. Runs inside the
// Worker spawned by wasm_engine_proxy.ts. Dropped relative to upstream: the
// memory64 wasm variant (we only build+vendor the 32-bit
// trace_processor.wasm — see vendor-wasm.yml) and the on-disk filesystem
// hooks (not needed to just parse a trace and run SQL over it).

import {ensureExists, assertTrue} from './assert';

// Allocated once by the C++ side; used to copy input request data across
// the JS<>Wasm boundary without touching the (small) call stack.
const REQ_BUF_SIZE = 32 * 1024 * 1024;

// Minimal surface of the Emscripten MODULARIZE()'d module instance we use.
interface TraceProcessorModule {
  HEAPU8: Uint8Array;
  ccall(
    name: string,
    ret: string | null,
    argTypes: string[],
    args: unknown[],
  ): unknown;
  addFunction(fn: (...args: never[]) => void, signature: string): number;
}

type TraceProcessorModuleFactory = (opts: {
  locateFile: (s: string) => string;
  print: (line: string) => void;
  printErr: (line: string) => void;
  instantiateWasm: (
    imports: WebAssembly.Imports,
    successCallback: (
      instance: WebAssembly.Instance,
      module: WebAssembly.Module,
    ) => void,
  ) => WebAssembly.Exports;
}) => Promise<TraceProcessorModule>;

// The end-to-end interaction between JS and Wasm is as follows:
// - [JS] Inbound data received by the worker (onmessage() in worker.ts).
//   - [JS] onMessage() (this file)
//     - [C++] trace_processor_on_rpc_request (wasm_bridge.cc)
//       - [C++] some TraceProcessor::method()
//         for (batch in result_rows)
//           - [C++] RpcResponseFunction(bytes) (wasm_bridge.cc)
//             - [JS] onReply() (this file)
//               - [JS] postMessage() (this file)
export class WasmBridge {
  private aborted = false;
  private connection?: TraceProcessorModule;
  private reqBufferAddr = 0;
  private lastStderr: string[] = [];
  private messagePort?: MessagePort;

  // |wasmJsUrl| is fetched and loaded manually rather than through a
  // bundled or dynamic `import()`, for two reasons: (1) it's populated by a
  // separate CI pipeline (vendor-wasm.yml) — see packages/engine's README
  // for why — so it may not exist at build time, and (2) Emscripten's
  // `-sMODULARIZE` output here is a plain UMD script (`if (typeof exports
  // === 'object' && typeof module === 'object') module.exports = ...`),
  // not an ES module with a real `export` statement — native `import()`
  // would parse it fine but see zero exports, since browsers don't do
  // CommonJS interop for module scripts. We load it the way `require()`
  // would: run the script text as a function body with our own `module`/
  // `exports` objects and read back what it assigned to them.
  //
  // |wasmModule| is compiled once on the main thread (wasm_engine_proxy.ts)
  // so V8 can reuse the same tiered-up wasm code if more than one worker is
  // ever spawned.
  async initialize(
    port: MessagePort,
    wasmJsUrl: string,
    wasmModule: WebAssembly.Module,
  ): Promise<void> {
    assertTrue(this.messagePort === undefined);
    this.messagePort = port;

    const initModule = await this.loadModuleFactory(wasmJsUrl);
    const connection = await initModule({
      locateFile: (s: string) => s,
      print: (line: string) => console.log(line),
      printErr: (line: string) => this.appendAndLogErr(line),
      instantiateWasm: (imports, successCallback) => {
        const instance = new WebAssembly.Instance(wasmModule, imports);
        successCallback(instance, wasmModule);
        return instance.exports;
      },
    });
    const fn = connection.addFunction(
      this.onReply.bind(this) as (...args: never[]) => void,
      'vpi',
    );
    this.reqBufferAddr = Number(
      connection.ccall(
        'trace_processor_rpc_init',
        'pointer',
        ['pointer', 'number'],
        [fn, REQ_BUF_SIZE],
      ),
    ) >>> 0;
    this.connection = connection;

    // Setting .onmessage implicitly calls port.start() and flushes any
    // messages queued while we were awaiting module initialization.
    port.onmessage = this.onMessage.bind(this);
  }

  // Fetches trace_processor.js and extracts its UMD `module.exports` — see
  // the comment on initialize() for why this can't just be `import()`ed.
  private async loadModuleFactory(
    wasmJsUrl: string,
  ): Promise<TraceProcessorModuleFactory> {
    const src = await (await fetch(wasmJsUrl)).text();
    const moduleObj: {exports: {default?: TraceProcessorModuleFactory}} = {
      exports: {},
    };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const runUmd = new Function('module', 'exports', src);
    runUmd(moduleObj, moduleObj.exports);
    return ensureExists(
      moduleObj.exports.default,
      `${wasmJsUrl} did not assign module.exports.default — its UMD wrapper may have changed`,
    );
  }

  private onMessage(msg: MessageEvent) {
    if (this.aborted) {
      throw new Error('Wasm module crashed');
    }
    const connection = ensureExists(this.connection);
    assertTrue(msg.data instanceof Uint8Array);
    const data = msg.data as Uint8Array;
    let wrSize = 0;
    // The RPC channel is byte-oriented and copes with arbitrary
    // fragmentation, so split large requests across multiple writes into
    // our (fixed-size) JS<>Wasm interop buffer.
    while (wrSize < data.length) {
      const sliceLen = Math.min(data.length - wrSize, REQ_BUF_SIZE);
      const dataSlice = data.subarray(wrSize, wrSize + sliceLen);
      connection.HEAPU8.set(dataSlice, this.reqBufferAddr);
      wrSize += sliceLen;
      try {
        connection.ccall(
          'trace_processor_on_rpc_request',
          'void',
          ['number'],
          [sliceLen],
        );
      } catch (err) {
        this.aborted = true;
        let abortReason = `${err}`;
        if (err instanceof Error) {
          abortReason = `${err.name}: ${err.message}\n${err.stack}`;
        }
        abortReason += '\n\nstderr: \n' + this.lastStderr.join('\n');
        throw new Error(abortReason);
      }
    }
  }

  // Bound and passed to initialize(); called by the C++ side from within
  // ccall(trace_processor_on_rpc_request). |heapPtrArg| arrives as a plain
  // (possibly negative, if > 2GB) JS number — the wasm<>JS interop passes
  // pointer args as uint32_t, which JS can represent as a negative number;
  // ">>> 0" forces it back to the intended unsigned offset into HEAPU8.
  private onReply(heapPtrArg: number, size: number) {
    const heapPtr = heapPtrArg >>> 0;
    const data = ensureExists(this.connection).HEAPU8.slice(
      heapPtr,
      heapPtr + size,
    );
    ensureExists(this.messagePort).postMessage(data, [data.buffer]);
  }

  private appendAndLogErr(line: string) {
    console.warn(line);
    this.lastStderr.push(line);
    if (this.lastStderr.length > 512) {
      this.lastStderr.shift();
    }
  }
}
