// Mirrors the protobuf half of Perfetto's ui/src/base/static_initializers.ts
// (we don't use immer, so that half is dropped).

import protobuf from 'protobufjs/minimal';

let initialized = false;

// Disables Long.js support in protobufjs: reader.int64()/writer.int64() then
// work with plain JS numbers (accepting the 2**53 precision limit) instead
// of Long instances. This package never links in long.js, so protobufjs
// falls back to plain numbers regardless — this just makes that explicit
// and matches upstream's `--force-number` pbjs codegen flag.
export function ensureProtobufConfigured() {
  if (initialized) return;
  (protobuf.util as {Long?: unknown}).Long = undefined;
  protobuf.configure();
  initialized = true;
}
