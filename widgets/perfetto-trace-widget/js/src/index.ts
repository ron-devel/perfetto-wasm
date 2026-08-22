// anywidget entrypoint: https://anywidget.dev — `export default {render}`,
// where `render({model, el})` mounts into the widget's output DOM node and
// talks to Python via `model.get/set/on/save_changes` (state) and
// `model.send`/`model.on('msg:custom', ...)` (commands).
//
// UI lives entirely here (a file input + status line): only the browser can
// pick a File, so trace loading is user-driven from JS. Querying is
// Python-driven and keyed by query_id, not shared single-slot state:
// PerfettoTraceWidget.run_query() (see widget.py) sends a `run_query`
// custom message with a fresh id, this file runs it and writes the result
// into `results_json[query_id]` — never overwriting another query's
// still-live result — which flows back to Python as a `results_json` trait
// update. That's what lets a notebook fire off several queries and read
// each one's own DataFrame independently, and what makes
// `mo.ui.anywidget(widget)` (marimo) re-run dependent cells once a query
// actually finishes.
//
// Each column also carries a `dtype` ('int64' | 'float64' | 'string' |
// 'bytes' | 'object'), inferred from the actual JS runtime type of its
// (decoded) cells -- see classifyColumn() -- so widget.py can build a
// properly-typed DataFrame instead of guessing post-hoc.

import {createEngine, DEFAULT_WASM_BASE_URL, type SqlValue, type TraceEngine} from './perfetto_engine';

interface AnyModel {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  save_changes(): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
}

interface RunQueryMessage {
  type: 'run_query';
  query_id: string;
  sql: string;
}

type ColumnDtype = 'int64' | 'float64' | 'string' | 'bytes' | 'object';

interface SerializedColumn {
  name: string;
  dtype: ColumnDtype;
  // bigint -> string (JSON has no bigint), Uint8Array -> number[] (JSON has
  // no bytes type), everything else passes through as-is.
  values: ReadonlyArray<string | number | boolean | null | number[]>;
}

// A column's dtype is the JS runtime type shared by all its non-null
// cells; a column with mixed cell types (SQLite's dynamic typing allows a
// column to hold different types per row) or with no non-null cells at
// all falls back to 'object'.
function classifyColumn(values: ReadonlyArray<SqlValue>): ColumnDtype {
  let seen: ColumnDtype | undefined;
  for (const v of values) {
    if (v === null) continue;
    const kind: ColumnDtype =
      typeof v === 'bigint'
        ? 'int64'
        : typeof v === 'number'
          ? 'float64'
          : typeof v === 'string'
            ? 'string'
            : v instanceof Uint8Array
              ? 'bytes'
              : 'object';
    if (seen === undefined) seen = kind;
    else if (seen !== kind) return 'object';
  }
  return seen ?? 'object';
}

function serializeColumns(
  columns: ReadonlyArray<{name: string; values: ReadonlyArray<SqlValue>}>,
): SerializedColumn[] {
  return columns.map((c) => ({
    name: c.name,
    dtype: classifyColumn(c.values),
    values: c.values.map((v) =>
      typeof v === 'bigint' ? v.toString() : v instanceof Uint8Array ? Array.from(v) : v,
    ),
  }));
}

function render({model, el}: {model: AnyModel; el: HTMLElement}) {
  let engine: TraceEngine | undefined;

  const root = document.createElement('div');
  root.style.fontFamily = 'system-ui, sans-serif';
  root.style.fontSize = '0.9em';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.perfetto_trace,.pftrace,.json,.gz';

  const status = document.createElement('div');
  status.style.marginTop = '0.5em';
  status.style.color = '#555';
  status.textContent = 'Pick a trace file to begin.';

  root.append(fileInput, status);
  el.appendChild(root);

  function setStatus(text: string) {
    status.textContent = text;
    model.set('status', text);
    model.save_changes();
  }

  function setError(err: unknown) {
    model.set('error', err instanceof Error ? err.message : String(err));
    model.save_changes();
  }

  async function getEngine(): Promise<TraceEngine> {
    if (engine === undefined) {
      const wasmBaseUrl =
        (model.get('wasm_base_url') as string) || DEFAULT_WASM_BASE_URL;
      engine = await createEngine({wasmBaseUrl});
    }
    return engine;
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    setStatus(`Loading ${file.name}…`);
    try {
      const eng = await getEngine();
      const bytes = new Uint8Array(await file.arrayBuffer());
      await eng.parse(bytes);
      await eng.notifyEof();
      setStatus(`Loaded ${file.name}. Call run_query() from Python to query it.`);
      model.set('error', '');
      model.save_changes();
    } catch (err) {
      setStatus('Failed to load trace — see .error');
      setError(err);
    }
  });

  // Merges one query's outcome into the results dict without touching any
  // other query_id's entry -- the whole point of keying by query_id.
  function setResult(
    queryId: string,
    entry: {columns: SerializedColumn[]; row_count: number; error: string | null},
  ) {
    const current = JSON.parse((model.get('results_json') as string) || '{}') as Record<
      string,
      unknown
    >;
    current[queryId] = entry;
    model.set('results_json', JSON.stringify(current));
    model.save_changes();
  }

  async function runQuery(queryId: string, sql: string) {
    setStatus(`Running ${queryId}…`);
    try {
      const eng = await getEngine();
      const result = await eng.query(sql);
      setResult(queryId, {
        columns: serializeColumns(result.columns),
        row_count: result.rowCount,
        error: null,
      });
      setStatus(`${queryId}: ${result.rowCount} row(s).`);
    } catch (err) {
      setResult(queryId, {
        columns: [],
        row_count: 0,
        error: err instanceof Error ? err.message : String(err),
      });
      setStatus(`${queryId}: failed — see its result's "error".`);
    }
  }

  model.on('msg:custom', (msg: unknown) => {
    const m = msg as Partial<RunQueryMessage>;
    if (m.type === 'run_query' && m.query_id && m.sql !== undefined) {
      void runQuery(m.query_id, m.sql);
    }
  });

  return () => {
    engine?.dispose();
  };
}

export default {render};
