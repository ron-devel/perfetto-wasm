# Third-party code

This repository is licensed Apache-2.0 (see `LICENSE`), the same license as
[google/perfetto](https://github.com/google/perfetto), which
`packages/engine` is derived from:

- `packages/engine/src/internal/*.ts` are ports of Perfetto's
  `ui/src/trace_processor/*.ts` and `ui/src/engine/*.ts` (trimmed to the
  subset needed to parse a trace and run ad-hoc SQL — see the comment at the
  top of each file for specifics), Copyright (C) The Android Open Source
  Project.
- `trace_processor.wasm` (vendored into `vendor/trace_processor/` by the
  `vendor-wasm` GitHub Actions workflow, not committed to this repo's
  history directly) is built from Perfetto's C++ `trace_processor` at the
  revision pinned in `vendor/PERFETTO_REV`.
