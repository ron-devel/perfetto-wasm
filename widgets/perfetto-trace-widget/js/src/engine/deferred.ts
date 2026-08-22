// Port of Perfetto's ui/src/base/deferred.ts.

export interface Deferred<T> extends Promise<T> {
  readonly resolve: (value?: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
}

export function defer<T>(): Deferred<T> {
  let resolve!: (value?: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const p = new Promise<T>((res, rej) => {
    resolve = res as (value?: T | PromiseLike<T>) => void;
    reject = rej;
  });
  return Object.assign(p, {resolve, reject}) as Deferred<T>;
}
