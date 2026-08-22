<script lang="ts">
  import {createEngine, EngineNotReadyError, type TraceEngine, type QueryResultColumn} from '@perfetto-wasm/engine';

  let engine: TraceEngine | undefined;
  let status = $state('');
  let sql = $state('select name from slice limit 10');
  let columns: ReadonlyArray<QueryResultColumn> = $state([]);

  async function getEngine(): Promise<TraceEngine> {
    if (engine === undefined) {
      engine = await createEngine();
    }
    return engine;
  }

  function describeError(err: unknown): string {
    return err instanceof EngineNotReadyError ? err.message : String(err);
  }

  async function onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    status = `Loading ${file.name}…`;
    try {
      const eng = await getEngine();
      const buf = new Uint8Array(await file.arrayBuffer());
      await eng.parse(buf);
      await eng.notifyEof();
      status = `Loaded ${file.name}`;
    } catch (err) {
      status = describeError(err);
    }
  }

  async function runQuery() {
    try {
      const eng = await getEngine();
      const result = await eng.query(sql);
      columns = result.columns;
    } catch (err) {
      status = describeError(err);
    }
  }

  const rowCount = $derived(columns.length > 0 ? columns[0].values.length : 0);
</script>

<main>
  <h1>Perfetto trace query — Svelte demo</h1>
  <p class="subtitle">
    Same trace_processor wasm engine as the vanilla demo, wired up with Svelte reactivity.
    <a href="../">← vanilla demo</a>
  </p>

  <section>
    <label for="trace-file">Trace file</label>
    <input id="trace-file" type="file" onchange={onFileChange} />
    <span class="status">{status}</span>
  </section>

  <section>
    <label for="sql">SQL query</label>
    <textarea id="sql" rows="4" bind:value={sql}></textarea>
    <button type="button" onclick={runQuery}>Run query</button>
  </section>

  <section>
    <table>
      {#if columns.length > 0}
        <thead>
          <tr>
            {#each columns as col}
              <th>{col.name}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each {length: rowCount} as _, i}
            <tr>
              {#each columns as col}
                <td>{col.values[i]}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      {/if}
    </table>
  </section>
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .subtitle {
    color: #555;
  }

  section {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  textarea {
    width: 100%;
    font-family: monospace;
  }

  .status {
    display: block;
    margin-top: 0.5rem;
    color: #555;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  td,
  th {
    border: 1px solid #ccc;
    padding: 0.25rem 0.5rem;
    text-align: left;
  }
</style>
