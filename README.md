# perfetto-wasm

Minimal demo pages that load a [Perfetto](https://perfetto.dev) trace with
`trace_processor.wasm` and run SQL against it in the browser — no full
Perfetto UI required. Two demo apps share the same trace-processor client:

- `apps/vanilla` — plain HTML/TS, no framework.
- `apps/svelte` — same functionality, built with Svelte.
- `packages/engine` — the trace_processor RPC client both demos import.
  Currently a stub; see `vendor/PERFETTO_REV` below.

## Status

This repo vendors the `trace_processor.wasm` binary and its JS/TS wrapper
from [google/perfetto](https://github.com/google/perfetto) rather than
building the whole Perfetto UI. The pinned upstream revision is recorded in
`vendor/PERFETTO_REV`; `.github/workflows/vendor-wasm.yml` (manual trigger)
rebuilds `vendor/trace_processor/` from that revision. Until that workflow
has been run at least once, `packages/engine` throws `EngineNotReadyError`
and both demos show that in the status line instead of loading a trace.

## Development

```sh
npm install
npm run dev:vanilla   # apps/vanilla on localhost
npm run dev:svelte    # apps/svelte on localhost
npm run build          # builds both apps
```

## Deploys

- `main` branch → GitHub Pages, vanilla demo at `/`, Svelte demo at `/svelte/`.
- Pull requests → a staging preview at `/pr-preview/pr-<n>/`, commented on
  the PR automatically.

GitHub Pages must be configured to deploy from the `gh-pages` branch (repo
Settings → Pages → Source → "Deploy from a branch" → `gh-pages` / `/`).
