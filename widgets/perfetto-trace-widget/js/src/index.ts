// anywidget entrypoint: https://anywidget.dev — `export default {render}`,
// where `render({model, el})` mounts into the widget's output DOM node and
// talks to Python via `model.get/set/on/save_changes`.
//
// UI lives entirely here (a file input + status line): only the browser can
// pick a File, so trace loading is user-driven from JS. Querying is
// Python-driven: PerfettoTraceWidget.run_query() (see widget.py) bumps the
// `_query_seq` trait, which this file watches and reacts to by running
// `sql` against the loaded trace and writing the result back into
// `columns_json` / `row_count` / `error` — those changes flow back to
// Python as ordinary trait updates, which is what makes
// `mo.ui.anywidget(widget)` (marimo) or plain ipywidgets re-run dependent
// cells once the query actually finishes.

import {createEngine, DEFAULT_WASM_BASE_URL, type TraceEngine} from './perfetto_engine';

interface AnyModel {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  save_changes(): void;
  on(event: string, callback: () => void): void;
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
      setStatus(`Loaded ${file.name}. Set .sql (or call run_query()) from Python to query it.`);
      model.set('error', '');
      model.save_changes();
    } catch (err) {
      setStatus('Failed to load trace — see .error');
      setError(err);
    }
  });

  async function runQuery() {
    const sql = model.get('sql') as string;
    if (!sql) return;
    setStatus('Running query…');
    try {
      const eng = await getEngine();
      const result = await eng.query(sql);
      // JSON has no bigint; trace_processor's 64-bit int columns come back
      // as bigint, so stringify those. Blob columns become plain number
      // arrays (JSON has no bytes type either).
      const columns = result.columns.map((c) => ({
        name: c.name,
        values: c.values.map((v) =>
          typeof v === 'bigint'
            ? v.toString()
            : v instanceof Uint8Array
              ? Array.from(v)
              : v,
        ),
      }));
      model.set('columns_json', JSON.stringify(columns));
      model.set('row_count', result.rowCount);
      model.set('error', '');
      setStatus(`${result.rowCount} row(s).`);
      model.save_changes();
    } catch (err) {
      model.set('columns_json', '[]');
      model.set('row_count', 0);
      setStatus('Query failed — see .error');
      setError(err);
    }
  }

  model.on('change:_query_seq', runQuery);

  return () => {
    engine?.dispose();
  };
}

export default {render};
