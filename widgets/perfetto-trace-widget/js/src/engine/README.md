# engine/

This directory is a deliberate copy of
[`packages/engine/src/internal`](../../../../packages/engine/src/internal)
from the parent `perfetto-wasm` repo (the trace_processor RPC wrapper: proto
ring buffer framing, hand-rolled wire encode/decode, streaming QueryResult
decoding, wasm worker bridge) — see that directory's own comments for what
it does and why (in short: a trimmed, from-scratch-typed port of Perfetto's
`ui/src/trace_processor` and `ui/src/engine`).

It's copied rather than depended on so this widget package has zero
coupling to the `perfetto-wasm` monorepo and can be published/reused on its
own. `assert.ts` through `wasm_bridge.ts` are unmodified copies.
`wasm_engine_proxy.ts` in the parent directory (not here — see
`../perfetto_engine.ts`) differs: it takes a configurable wasm asset base
URL and worker factory instead of assuming a Vite app's `import.meta.env`
and a co-located `worker.ts`.

If you fix a bug in the RPC/decoding logic here, check whether the same fix
applies upstream in `packages/engine`, and vice versa — there's currently no
automated sync between the two copies.
