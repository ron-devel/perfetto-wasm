import {createEngine, EngineNotReadyError, type TraceEngine} from '@perfetto-wasm/engine';

// Not yet in lib.dom.d.ts.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

// The browser only fires this once the page passes its installability
// checks (manifest + service worker + icons, all wired up in
// vite.config.ts) -- stash the event so the button can trigger the native
// install prompt on demand instead of the browser's own (easy-to-miss) UI.
const installBtn = document.getElementById('install-btn') as HTMLButtonElement;
let deferredInstallPrompt: BeforeInstallPromptEvent | undefined;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  deferredInstallPrompt = undefined;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
});

const fileInput = document.getElementById('trace-file') as HTMLInputElement;
const statusEl = document.getElementById('trace-status')!;
const sqlEl = document.getElementById('sql') as HTMLTextAreaElement;
const runButton = document.getElementById('run-query') as HTMLButtonElement;
const resultsEl = document.getElementById('results') as HTMLTableElement;

let engine: TraceEngine | undefined;

async function getEngine(): Promise<TraceEngine> {
  if (engine === undefined) {
    engine = await createEngine();
  }
  return engine;
}

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  statusEl.textContent = `Loading ${file.name}…`;
  try {
    const eng = await getEngine();
    const buf = new Uint8Array(await file.arrayBuffer());
    await eng.parse(buf);
    await eng.notifyEof();
    statusEl.textContent = `Loaded ${file.name}`;
  } catch (err) {
    statusEl.textContent = describeError(err);
  }
});

runButton.addEventListener('click', async () => {
  try {
    const eng = await getEngine();
    const result = await eng.query(sqlEl.value);
    renderResults(result.columns);
  } catch (err) {
    statusEl.textContent = describeError(err);
  }
});

function describeError(err: unknown): string {
  return err instanceof EngineNotReadyError ? err.message : String(err);
}

function renderResults(columns: ReadonlyArray<{name: string; values: ReadonlyArray<unknown>}>) {
  resultsEl.innerHTML = '';
  if (columns.length === 0) return;

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const col of columns) {
    const th = document.createElement('th');
    th.textContent = col.name;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  resultsEl.appendChild(thead);

  const tbody = document.createElement('tbody');
  const rowCount = columns[0].values.length;
  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement('tr');
    for (const col of columns) {
      const td = document.createElement('td');
      td.textContent = String(col.values[i]);
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }
  resultsEl.appendChild(tbody);
}
