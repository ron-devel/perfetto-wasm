# Getting started: querying a Perfetto trace in the browser

This walks through going from an empty project to a page that loads a
`.perfetto_trace` file and runs SQL against it with `trace_processor.wasm`,
using the `@perfetto-wasm/engine` client from this repo. It covers plain
HTML, Svelte, and Vue.

If you just want to see it working, `apps/vanilla` and `apps/svelte` in this
repo are the reference implementations everything below is drawn from.

## The two pieces you need

1. **`trace_processor.wasm` + `trace_processor.js`** — the compiled trace
   processor engine and its Emscripten loader. Built from
   [google/perfetto](https://github.com/google/perfetto) by this repo's
   `vendor-wasm` GitHub Actions workflow, checked into
   [`vendor/trace_processor/`](../vendor/trace_processor/).
2. **`packages/engine`** — a small TypeScript client (`@perfetto-wasm/engine`)
   that spawns a Worker, loads the wasm into it, and speaks trace_processor's
   RPC protocol so you can call `parse()`/`query()` instead of hand-rolling
   protobuf.

`@perfetto-wasm/engine` isn't published to npm yet, so "from scratch" today
means copying both pieces into your project:

```sh
# from a clone of this repo, inside your own project:
cp -r path/to/perfetto-wasm/packages/engine/src   ./src/perfetto-engine
cp -r path/to/perfetto-wasm/vendor/trace_processor ./public/trace_processor
```

(Once it's published, this collapses to `npm install @perfetto-wasm/engine`
plus fetching the wasm at build time — the API below won't change.)

You need `protobufjs` as a real dependency (the engine's only runtime
dependency):

```sh
npm install protobufjs
```

## Why this only works with a bundler that understands Worker imports

`packages/engine` spawns a Web Worker via
`new Worker(new URL('./worker.ts', import.meta.url), {type: 'module'})`.
Vite, and most modern bundlers, recognize this pattern and bundle the worker
automatically. If you're not using a bundler that does this (e.g. serving
raw TypeScript with no build step), you'll need to build the worker
yourself and adjust `wasm_engine_proxy.ts`'s `create()` accordingly. This
guide assumes Vite, since that's what every example app in this repo uses.

## Step 1: serve the wasm as a static asset

The engine fetches `trace_processor.wasm` and `trace_processor.js` at
**runtime**, from wherever your app is served — they are not bundled into
your JS. In Vite, the simplest way is to point `publicDir` at the vendored
folder so both files land at your site's root:

```ts
// vite.config.ts
import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  publicDir: fileURLToPath(new URL('./public/trace_processor', import.meta.url)),
});
```

If you already use `public/` for other assets, copy the two files in there
directly instead (`trace_processor.wasm`, `trace_processor.js`) rather than
repointing `publicDir` — the engine just needs them reachable at
`<base>/trace_processor.wasm` and `<base>/trace_processor.js`.

One gotcha if you fetch these from git-lfs: **`git-lfs` pointer files look
like valid small text files and will build "successfully" while shipping
garbage.** If you ever see `trace_processor.wasm` sitting at a few hundred
bytes instead of ~13MB, that's an unresolved LFS pointer, not the real
binary — see this repo's `vendor-wasm.yml` / `deploy.yml` for how CI avoids
this (`actions/checkout` needs `lfs: true`).

## Step 2: the API

```ts
import {createEngine} from './perfetto-engine';
// or, once published: import {createEngine} from '@perfetto-wasm/engine';

const engine = await createEngine();

// Stream the trace file in. Call parse() once per chunk (a single call
// with the whole file works fine too), then notifyEof() once.
const bytes = new Uint8Array(await file.arrayBuffer());
await engine.parse(bytes);
await engine.notifyEof();

// Run SQL. Resolves once all rows have arrived.
const result = await engine.query('select name, dur from slice limit 10');
console.log(result.rowCount);           // number
console.log(result.columns);            // [{name: 'name', values: [...]}, {name: 'dur', values: [...]}]

// Free the worker when you're done with this trace.
engine.dispose();
```

`createEngine()` rejects with `EngineNotReadyError` if the wasm couldn't be
fetched/compiled — check `vendor/trace_processor/` (or wherever you're
serving it from) actually has the real files, not LFS stubs, if you hit
this.

### `QueryResult` shape

```ts
interface QueryResultColumn {
  name: string;
  values: ReadonlyArray<string | number | bigint | null | Uint8Array>;
}
interface QueryResult {
  columns: ReadonlyArray<QueryResultColumn>;
  rowCount: number;
}
```

Columns are returned in query order; `values[i]` across all columns
corresponds to the same row `i`. Integer columns can come back as `bigint`
(trace_processor's 64-bit `int`/`long` types) — don't assume `number`.

## Step 3: a minimal page (plain HTML + Vite)

```html
<!-- index.html -->
<input id="file" type="file" />
<textarea id="sql">select name from slice limit 10</textarea>
<button id="run">Run</button>
<table id="results"></table>
<script type="module" src="./main.ts"></script>
```

```ts
// main.ts
import {createEngine, type TraceEngine} from './perfetto-engine';

let engine: TraceEngine | undefined;

document.getElementById('file')!.addEventListener('change', async (e) => {
  engine ??= await createEngine();
  const file = (e.target as HTMLInputElement).files![0];
  await engine.parse(new Uint8Array(await file.arrayBuffer()));
  await engine.notifyEof();
});

document.getElementById('run')!.addEventListener('click', async () => {
  engine ??= await createEngine();
  const sql = (document.getElementById('sql') as HTMLTextAreaElement).value;
  const {columns} = await engine.query(sql);
  const table = document.getElementById('results')!;
  table.innerHTML =
    '<tr>' + columns.map((c) => `<th>${c.name}</th>`).join('') + '</tr>' +
    (columns[0]?.values ?? []).map((_, row) =>
      '<tr>' + columns.map((c) => `<td>${String(c.values[row])}</td>`).join('') + '</tr>',
    ).join('');
});
```

That's the whole thing — see `apps/vanilla` in this repo for the polished
version with error handling.

## Step 4: Svelte

The engine is framework-agnostic, so Svelte usage is just calling the same
API from component state:

```svelte
<script lang="ts">
  import {createEngine, type TraceEngine, type QueryResultColumn} from './perfetto-engine';

  let engine: TraceEngine | undefined;
  let sql = $state('select name from slice limit 10');
  let columns: ReadonlyArray<QueryResultColumn> = $state([]);

  async function getEngine() {
    engine ??= await createEngine();
    return engine;
  }

  async function onFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const eng = await getEngine();
    await eng.parse(new Uint8Array(await file.arrayBuffer()));
    await eng.notifyEof();
  }

  async function runQuery() {
    const eng = await getEngine();
    columns = (await eng.query(sql)).columns;
  }
</script>

<input type="file" onchange={onFile} />
<textarea bind:value={sql}></textarea>
<button onclick={runQuery}>Run</button>
<table>
  {#each columns as col}<!-- render as needed -->{/each}
</table>
```

See `apps/svelte` for the full version (Svelte 5 runes, table rendering).

## Step 5: Vue

Same shape, Vue's reactivity instead of Svelte's:

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {createEngine, type TraceEngine, type QueryResultColumn} from './perfetto-engine';

let engine: TraceEngine | undefined;
const sql = ref('select name from slice limit 10');
const columns = ref<ReadonlyArray<QueryResultColumn>>([]);

async function getEngine() {
  engine ??= await createEngine();
  return engine;
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const eng = await getEngine();
  await eng.parse(new Uint8Array(await file.arrayBuffer()));
  await eng.notifyEof();
}

async function runQuery() {
  const eng = await getEngine();
  columns.value = (await eng.query(sql.value)).columns;
}
</script>

<template>
  <input type="file" @change="onFile" />
  <textarea v-model="sql"></textarea>
  <button @click="runQuery">Run</button>
  <table><!-- render columns as needed --></table>
</template>
```

(There's no `apps/vue` in this repo yet — this is unverified against a real
build, unlike the Svelte/vanilla examples. The API surface is identical
either way, so the risk is in Vue/Vite wiring, not the engine.)

## Step 6: visualizing results

`result.columns` is already shaped for a table (see above). For an actual
chart, pull one column's `values` out and hand it to whatever charting
library you like — nothing about the engine is chart-specific. A dependency
-free bar chart, as a starting point:

```ts
function renderBarChart(el: HTMLElement, labels: string[], values: number[]) {
  const max = Math.max(...values, 1);
  el.innerHTML = labels
    .map(
      (label, i) => `
      <div style="display:flex; align-items:center; gap:0.5em;">
        <span style="width:8em; text-align:right;">${label}</span>
        <div style="background:#3b82f6; height:1em; width:${(values[i] / max) * 100}%"></div>
        <span>${values[i]}</span>
      </div>`,
    )
    .join('');
}

// usage, e.g. after querying `select name, count(*) as n from slice group by name order by n desc limit 10`
const {columns} = await engine.query(
  'select name, count(*) as n from slice group by name order by n desc limit 10',
);
const names = columns.find((c) => c.name === 'name')!.values as string[];
const counts = columns.find((c) => c.name === 'n')!.values.map(Number);
renderBarChart(document.getElementById('chart')!, names, counts);
```

For anything beyond a quick bar chart, feed `columns` into
[Observable Plot](https://observablehq.com/plot/), Chart.js, or similar —
just remember to convert `bigint` values to `number` first if the library
doesn't understand bigints (most don't).

## Common pitfalls

- **`EngineNotReadyError` at runtime**: `trace_processor.wasm`/`.js` aren't
  reachable at `<base>/trace_processor.wasm` — check `publicDir`/your static
  file setup, and that the files aren't unresolved git-lfs pointers.
- **`SyntaxError: Unexpected token '<'` from the worker**: usually the wasm
  loader URL 404'd (served an HTML error page) and something tried to parse
  it as JS — same root cause as above.
- **Worker fails to fetch `trace_processor.js`** even though it loads fine
  on the main thread: a Worker resolves relative fetch URLs against *its
  own* script location, not the page's. If you're computing that URL
  yourself (rather than reusing this repo's `wasm_engine_proxy.ts`), make
  sure it's absolute before it crosses into the worker.
- **`trace_processor.js` isn't a real ES module** — Emscripten's
  `-sMODULARIZE` output here is a UMD script (`module.exports = ...`), not
  `export default ...`. Don't `import()` it directly; see
  `internal/wasm_bridge.ts`'s `loadModuleFactory()` for how this repo loads
  it (fetch as text, run as a function body with your own `module`/
  `exports`).
