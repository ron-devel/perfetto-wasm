// Trimmed port of Perfetto's ui/src/base/assert.ts — only the assertions
// actually used by this package's RPC wrapper.

export function assertTrue(x: unknown, msg?: string): asserts x {
  if (!x) {
    throw new Error(msg ?? 'Failed assertion');
  }
}

export function ensureExists<T>(x: T | null | undefined, msg?: string): T {
  if (x === null || x === undefined) {
    throw new Error(msg ?? 'Value is null or undefined');
  }
  return x;
}

export function assertFalse(x: unknown, msg?: string): void {
  if (x) {
    throw new Error(msg ?? 'Failed assertion');
  }
}
