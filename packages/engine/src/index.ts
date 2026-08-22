// Shared trace-processor client, consumed by every demo app in this repo
// (apps/vanilla, apps/svelte, ...). Wraps the ported RPC wrapper in
// internal/ (adapted from Perfetto's ui/src/trace_processor and
// ui/src/engine — see internal/*.ts for what changed and why) behind a
// small app-facing API.
//
// The trace_processor.wasm binary itself isn't part of this repo's source:
// it's vendored from google/perfetto by the vendor-wasm GitHub Actions
// workflow (manual trigger) into vendor/trace_processor/, which each app's
// Vite config serves as static assets (see apps/*/vite.config.ts
// `publicDir`). Until that workflow has run at least once, the fetch below
// 404s and createEngine() rejects with EngineNotReadyError.

import {UNKNOWN, type Row, type SqlValue} from './internal/query_result';
import {WasmEngineProxy} from './internal/wasm_engine_proxy';

export type {SqlValue};

export interface QueryResultColumn {
  name: string;
  values: ReadonlyArray<SqlValue>;
}

export interface QueryResult {
  columns: ReadonlyArray<QueryResultColumn>;
  rowCount: number;
}

export interface TraceEngine {
  // Streams trace bytes into trace_processor. Call repeatedly with chunks,
  // then notifyEof() once the whole file has been sent.
  parse(chunk: Uint8Array): Promise<void>;
  notifyEof(): Promise<void>;
  query(sql: string): Promise<QueryResult>;
  dispose(): void;
}

export class EngineNotReadyError extends Error {
  constructor(cause: unknown) {
    super(
      'Failed to load trace_processor.wasm. It has not been vendored yet ' +
        '— run the vendor-wasm GitHub Actions workflow, or check ' +
        'vendor/trace_processor/ exists if you expected it to be there.',
      {cause},
    );
    this.name = 'EngineNotReadyError';
  }
}

// Creates a TraceEngine backed by a trace_processor.wasm worker.
export async function createEngine(): Promise<TraceEngine> {
  let engine: WasmEngineProxy;
  try {
    engine = await WasmEngineProxy.create();
  } catch (cause) {
    throw new EngineNotReadyError(cause);
  }
  await engine.resetTraceProcessor();

  return {
    // Callers always hand us a real ArrayBuffer-backed chunk in practice
    // (e.g. from File.arrayBuffer()); the internal engine only accepts
    // that, while this public API stays permissive over plain Uint8Array.
    parse: (chunk) => engine.parse(chunk as Uint8Array<ArrayBuffer>),
    notifyEof: () => engine.notifyEof(),
    async query(sql) {
      const result = await engine.query(sql);
      const columnNames = result.columns();

      // UNKNOWN accepts any actual cell type — used here because we don't
      // know a caller's SQL's column types upfront (see RowIteratorBase.get
      // in internal/query_result.ts).
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
