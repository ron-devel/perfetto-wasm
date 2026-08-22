// Shared trace-processor client, consumed by every demo app in this repo
// (apps/vanilla, apps/svelte, ...). Today this only exposes the public
// surface both demos are built against; the implementation is a stub
// until the trace_processor.wasm build lands in vendor/trace_processor
// (see PERFETTO_REV) and the RPC wrapper is ported from Perfetto's
// ui/src/trace_processor and ui/src/engine.

export interface QueryResultColumn {
  name: string;
  values: ReadonlyArray<string | number | bigint | null>;
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
  constructor() {
    super(
      'trace_processor.wasm has not been vendored yet. Run the ' +
        'vendor-wasm workflow and port the RPC wrapper before this can ' +
        'load traces.',
    );
    this.name = 'EngineNotReadyError';
  }
}

// Creates a TraceEngine backed by the trace_processor wasm worker.
// Stubbed until the wasm artifact + RPC wrapper are in place.
export async function createEngine(): Promise<TraceEngine> {
  throw new EngineNotReadyError();
}
