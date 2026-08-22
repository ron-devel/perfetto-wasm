// Adapted copy of perfetto-wasm's packages/engine (both wasm_engine_proxy.ts
// and index.ts collapsed into one file) — see engine/README.md. Differs
// from the original in exactly two ways, both needed to run inside an
// anywidget bundle rather than a Vite app:
//
// 1. The wasm asset base URL is a constructor option instead of
//    `import.meta.env.BASE_URL` — there's no meaningful "app base path"
//    when this widget can be embedded in an arbitrary notebook page.
//    Defaults to this project's own published demo deployment, so the
//    widget works out of the box; override it to self-host the wasm.
// 2. The worker is a Vite `?worker&inline` import instead of
//    `new Worker(new URL('./worker.ts', import.meta.url))` — inlined as a
//    blob URL so the built widget bundle is a single JS file with no
//    separate worker.js to serve. This matters specifically for marimo's
//    `export html-wasm`: the exported page has no dev server to resolve a
//    second script from, just whatever's inlined in the bundle.

import {assertTrue} from './engine/assert';
import {EngineBase} from './engine/engine_base';
import {UNKNOWN, type Row, type SqlValue} from './engine/query_result';
import PerfettoWorker from './worker?worker&inline';

export type {SqlValue};

export const DEFAULT_WASM_BASE_URL = 'https://ron-devel.github.io/perfetto-wasm/';

export interface QueryResultColumn {
  name: string;
  values: ReadonlyArray<SqlValue>;
}

export interface QueryResult {
  columns: ReadonlyArray<QueryResultColumn>;
  rowCount: number;
}

export interface TraceEngine {
  parse(chunk: Uint8Array): Promise<void>;
  notifyEof(): Promise<void>;
  query(sql: string): Promise<QueryResult>;
  dispose(): void;
}

export class EngineNotReadyError extends Error {
  constructor(cause: unknown) {
    super('Failed to load trace_processor.wasm.', {cause});
    this.name = 'EngineNotReadyError';
  }
}

function assetUrl(base: string, name: string): string {
  const withSlash = base.endsWith('/') ? base : `${base}/`;
  return new URL(name, withSlash).href;
}

class WasmEngineProxy extends EngineBase {
  private port: MessagePort;
  private worker: Worker;

  private constructor(port: MessagePort, worker: Worker) {
    super();
    this.port = port;
    this.worker = worker;
    this.port.onmessage = this.onMessage.bind(this);
  }

  static async create(wasmBaseUrl: string): Promise<WasmEngineProxy> {
    const wasmModule = await WebAssembly.compileStreaming(
      fetch(assetUrl(wasmBaseUrl, 'trace_processor.wasm')),
    );
    const worker = new PerfettoWorker();
    const channel = new MessageChannel();
    worker.postMessage(
      {
        port: channel.port1,
        wasmModule,
        wasmJsUrl: assetUrl(wasmBaseUrl, 'trace_processor.js'),
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
    this.port.postMessage(data);
  }

  dispose() {
    this.worker.terminate();
  }
}

export interface CreateEngineOptions {
  // Where to fetch trace_processor.wasm / trace_processor.js from (a
  // directory URL — both files are expected directly inside it). Defaults
  // to this project's published demo deployment.
  wasmBaseUrl?: string;
}

// Creates a TraceEngine backed by a trace_processor.wasm worker.
export async function createEngine(
  options?: CreateEngineOptions,
): Promise<TraceEngine> {
  const wasmBaseUrl = options?.wasmBaseUrl ?? DEFAULT_WASM_BASE_URL;
  let engine: WasmEngineProxy;
  try {
    engine = await WasmEngineProxy.create(wasmBaseUrl);
  } catch (cause) {
    throw new EngineNotReadyError(cause);
  }
  await engine.resetTraceProcessor();

  return {
    parse: (chunk) => engine.parse(chunk as Uint8Array<ArrayBuffer>),
    notifyEof: () => engine.notifyEof(),
    async query(sql) {
      const result = await engine.query(sql);
      const columnNames = result.columns();

      const spec: Row = {};
      for (const name of columnNames) spec[name] = UNKNOWN;

      const values: SqlValue[][] = columnNames.map(() => []);
      for (const it = result.iter(spec); it.valid(); it.next()) {
        columnNames.forEach((name, i) => values[i].push(it.get(name)));
      }

      return {
        columns: columnNames.map((name, i) => ({name, values: values[i]})),
        rowCount: result.numRows(),
      };
    },
    dispose: () => engine.dispose(),
  };
}
