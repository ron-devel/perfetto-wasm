// Trimmed port of Perfetto's ui/src/trace_processor/query_result.ts.
//
// This deals with deserialization and iteration of the proto-encoded byte
// buffer trace_processor returns for a streaming query (the
// trace_processor.QueryResult message, see appendResultBatch() below). The
// wire format is hand-parsed here (not through generated protobufjs
// bindings) for the same reason as internal/rpc_wire.ts — see the comment
// there.
//
// Dropped relative to upstream: checkExtends/unionTypes (column-type
// widening helpers unused by a single generic result table), and
// timeFromSql/durationFromSql (Perfetto-UI-specific time-track helpers).

import protobuf from 'protobufjs/minimal';
import {defer, type Deferred} from './deferred';
import {ensureExists, assertFalse, assertTrue} from './assert';
import {ensureProtobufConfigured} from './protobuf_init';

ensureProtobufConfigured();

export type SqlValue = string | number | bigint | null | Uint8Array;

export const UNKNOWN: SqlValue = null;
export const NUM = 0;
export const STR = 'str';
export const NUM_NULL: number | null = 1;
export const STR_NULL: string | null = 'str_null';
export const BLOB: Uint8Array = new Uint8Array();
export const BLOB_NULL: Uint8Array | null = new Uint8Array();
export const LONG: bigint = 0n;
export const LONG_NULL: bigint | null = 1n;

const SHIFT_32BITS = 32n;

// Fast decode varint int64 into a bigint. Inspired by
// https://github.com/protobufjs/protobuf.js/blob/56b1e64979dae757b67a21d326e16acee39f2267/src/reader.js#L123
export function decodeInt64Varint(buf: Uint8Array, pos: number): bigint {
  let hi = 0;
  let lo = 0;
  let i = 0;

  if (buf.length - pos > 4) {
    for (; i < 4; ++i) {
      lo = (lo | ((buf[pos] & 127) << (i * 7))) >>> 0;
      if (buf[pos++] < 128) return BigInt(lo);
    }
    lo = (lo | ((buf[pos] & 127) << 28)) >>> 0;
    hi = (hi | ((buf[pos] & 127) >> 4)) >>> 0;
    if (buf[pos++] < 128) {
      return (BigInt(hi) << SHIFT_32BITS) | BigInt(lo);
    }
    i = 0;
  } else {
    for (; i < 3; ++i) {
      if (pos >= buf.length) throw Error('Index out of range');
      lo = (lo | ((buf[pos] & 127) << (i * 7))) >>> 0;
      if (buf[pos++] < 128) return BigInt(lo);
    }
    lo = (lo | ((buf[pos++] & 127) << (i * 7))) >>> 0;
    return (BigInt(hi) << SHIFT_32BITS) | BigInt(lo);
  }
  if (buf.length - pos > 4) {
    for (; i < 5; ++i) {
      hi = (hi | ((buf[pos] & 127) << (i * 7 + 3))) >>> 0;
      if (buf[pos++] < 128) {
        const big = (BigInt(hi) << SHIFT_32BITS) | BigInt(lo);
        return BigInt.asIntN(64, big);
      }
    }
  } else {
    for (; i < 5; ++i) {
      if (pos >= buf.length) throw Error('Index out of range');
      hi = (hi | ((buf[pos] & 127) << (i * 7 + 3))) >>> 0;
      if (buf[pos++] < 128) {
        const big = (BigInt(hi) << SHIFT_32BITS) | BigInt(lo);
        return BigInt.asIntN(64, big);
      }
    }
  }
  throw Error('invalid varint encoding');
}

export interface QueryErrorInfo {
  query: string;
}

export class QueryError extends Error {
  readonly queryErrorInfo: QueryErrorInfo;

  constructor(message: string, info: QueryErrorInfo) {
    super(message);
    this.queryErrorInfo = info;
  }

  toString() {
    return `${super.toString()}\nQuery:\n${this.queryErrorInfo.query}`;
  }
}

export interface Row {
  [key: string]: SqlValue;
}

export interface RowIteratorBase {
  valid(): boolean;
  next(): void;
  // Reflection support for columns not known upfront (our case: a
  // user-provided SQL query). Throws if the column name doesn't exist.
  get(columnName: string): SqlValue;
}

export type RowIterator<T extends Row> = RowIteratorBase & T;

function columnTypeToString(t: SqlValue): string {
  switch (t) {
    case NUM:
      return 'NUM';
    case NUM_NULL:
      return 'NUM_NULL';
    case STR:
      return 'STR';
    case STR_NULL:
      return 'STR_NULL';
    case BLOB:
      return 'BLOB';
    case BLOB_NULL:
      return 'BLOB_NULL';
    case LONG:
      return 'LONG';
    case LONG_NULL:
      return 'LONG_NULL';
    case UNKNOWN:
      return 'UNKNOWN';
    default:
      return `INVALID(${t})`;
  }
}

function isCompatible(actual: CellType, expected: SqlValue): boolean {
  switch (actual) {
    case CellType.CELL_NULL:
      return (
        expected === NUM_NULL ||
        expected === STR_NULL ||
        expected === BLOB_NULL ||
        expected === LONG_NULL ||
        expected === UNKNOWN
      );
    case CellType.CELL_VARINT:
      return (
        expected === NUM ||
        expected === NUM_NULL ||
        expected === LONG ||
        expected === LONG_NULL ||
        expected === UNKNOWN
      );
    case CellType.CELL_FLOAT64:
      return expected === NUM || expected === NUM_NULL || expected === UNKNOWN;
    case CellType.CELL_STRING:
      return expected === STR || expected === STR_NULL || expected === UNKNOWN;
    case CellType.CELL_BLOB:
      return (
        expected === BLOB || expected === BLOB_NULL || expected === UNKNOWN
      );
    default:
      throw new Error(`Unknown CellType ${actual}`);
  }
}

// Must match CellType in trace_processor.proto.
enum CellType {
  CELL_NULL = 1,
  CELL_VARINT = 2,
  CELL_FLOAT64 = 3,
  CELL_STRING = 4,
  CELL_BLOB = 5,
}

const CELL_TYPE_NAMES = [
  'UNKNOWN',
  'NULL',
  'VARINT',
  'FLOAT64',
  'STRING',
  'BLOB',
];

const TAG_LEN_DELIM = 2;

export interface QueryResult {
  iter<T extends Row>(spec: T): RowIterator<T>;
  firstRow<T extends Row>(spec: T): T;
  maybeFirstRow<T extends Row>(spec: T): T | undefined;
  error(): string | undefined;
  numRows(): number;
  isComplete(): boolean;
  waitAllRows(): Promise<QueryResult>;
  columns(): string[];
  elapsedTimeMs(): number;
}

// Interface exposed to engine_base.ts to pump in row batches as they arrive.
export interface WritableQueryResult {
  appendResultBatch(resBytes: Uint8Array<ArrayBuffer>): void;
  isComplete(): boolean;
}

class QueryResultImpl implements QueryResult, WritableQueryResult {
  columnNames: string[] = [];
  private _error?: string;
  private _numRows = 0;
  private _isComplete = false;
  private _errorInfo: QueryErrorInfo;
  private _elapsedTimeMs = 0;

  constructor(errorInfo: QueryErrorInfo) {
    this._errorInfo = errorInfo;
  }

  batches: ResultBatch[] = [];
  private allRowsPromise?: Deferred<QueryResult>;

  isComplete(): boolean {
    return this._isComplete;
  }
  numRows(): number {
    return this._numRows;
  }
  error(): string | undefined {
    return this._error;
  }
  columns(): string[] {
    return this.columnNames;
  }
  elapsedTimeMs(): number {
    return this._elapsedTimeMs;
  }

  iter<T extends Row>(spec: T): RowIterator<T> {
    const impl = new RowIteratorImplWithRowData(spec, this);
    return impl as unknown as RowIterator<T>;
  }

  firstRow<T extends Row>(spec: T): T {
    const impl = new RowIteratorImplWithRowData(spec, this);
    assertTrue(impl.valid());
    return impl as unknown as T;
  }

  maybeFirstRow<T extends Row>(spec: T): T | undefined {
    const impl = new RowIteratorImplWithRowData(spec, this);
    if (!impl.valid()) return undefined;
    return impl as unknown as T;
  }

  waitAllRows(): Promise<QueryResult> {
    assertTrue(this.allRowsPromise === undefined);
    this.allRowsPromise = defer<QueryResult>();
    if (this._isComplete) {
      this.resolveOrReject(this.allRowsPromise, this);
    }
    return this.allRowsPromise;
  }

  appendResultBatch(resBytes: Uint8Array<ArrayBuffer>) {
    const reader = protobuf.Reader.create(resBytes);
    assertTrue(reader.pos === 0);
    const columnNamesEmptyAtStartOfBatch = this.columnNames.length === 0;
    const columnNamesSet = new Set<string>();
    while (reader.pos < reader.len) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          // column_names. Only the first batch should carry these.
          assertTrue(columnNamesEmptyAtStartOfBatch);
          const origColName = reader.string();
          let colName = origColName;
          // Two columns can share a name (e.g. `select 1 as x, 2 as x`).
          // Column names become iterator object keys, so disambiguate.
          for (let i = 1; columnNamesSet.has(colName); ++i) {
            colName = `${origColName}_${i}`;
            assertTrue(i < 100);
          }
          columnNamesSet.add(colName);
          this.columnNames.push(colName);
          break;
        }
        case 2: {
          // error. Empty string means "no error" (protos don't distinguish
          // absent from empty).
          const err = reader.string();
          this._error = err !== undefined && err.length ? err : undefined;
          break;
        }
        case 3: {
          // batch
          const batchLen = reader.uint32();
          const batchRaw = resBytes.subarray(reader.pos, reader.pos + batchLen);
          reader.pos += batchLen;

          const parsedBatch = new ResultBatch(batchRaw);
          this.batches.push(parsedBatch);
          this._isComplete = parsedBatch.isLastBatch;

          const numColumns = this.columnNames.length;
          if (numColumns !== 0) {
            assertTrue(parsedBatch.numCells % numColumns === 0);
            this._numRows += parsedBatch.numCells / numColumns;
          } else {
            assertTrue(parsedBatch.numCells === 0);
          }
          break;
        }
        case 7:
          this._elapsedTimeMs = reader.double();
          break;
        default:
          // statement_count / statement_with_output_count /
          // last_statement_sql (fields 4-6): not exposed by this trimmed
          // port, skip over them like any other unknown field.
          reader.skipType(tag & 7);
          break;
      }
    }

    if (this._isComplete && this.allRowsPromise !== undefined) {
      this.resolveOrReject(this.allRowsPromise, this);
    }
  }

  get errorInfo(): QueryErrorInfo {
    return this._errorInfo;
  }

  private resolveOrReject(promise: Deferred<QueryResult>, arg: QueryResult) {
    if (this._error === undefined) {
      promise.resolve(arg);
    } else {
      promise.reject(new QueryError(this._error, this._errorInfo));
    }
  }
}

// Holds one received result batch and does partial parsing to tokenize the
// various cell groups (offsets only — full decode happens lazily as the
// iterator steps through rows). See trace_processor.proto's
// QueryResult.CellsBatch for the wire format this mirrors.
class ResultBatch {
  readonly isLastBatch: boolean = false;
  readonly batchBytes: Uint8Array<ArrayBuffer>;
  readonly cellTypesOff: number = 0;
  readonly cellTypesLen: number = 0;
  readonly varintOff: number = 0;
  readonly varintLen: number = 0;
  readonly float64Cells = new Float64Array();
  readonly blobCells: Uint8Array<ArrayBuffer>[] = [];
  readonly stringCells: string[] = [];

  constructor(batchBytes: Uint8Array<ArrayBuffer>) {
    this.batchBytes = batchBytes;
    const reader = protobuf.Reader.create(batchBytes);
    assertTrue(reader.pos === 0);
    const end = reader.len;

    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: // cell_types: packed array, one CellType byte per cell.
          assertTrue((tag & 7) === TAG_LEN_DELIM);
          this.cellTypesLen = reader.uint32();
          this.cellTypesOff = reader.pos;
          reader.pos += this.cellTypesLen;
          break;

        case 2: {
          // varint_cells: packed varint buffer.
          assertTrue((tag & 7) === TAG_LEN_DELIM);
          const packLen = reader.uint32();
          this.varintOff = reader.pos;
          this.varintLen = packLen;
          assertTrue(reader.buf === batchBytes);
          reader.pos += packLen;
          break;
        }

        case 3: {
          // float64_cells: 8-byte-aligned packed fixed64 buffer.
          assertTrue((tag & 7) === TAG_LEN_DELIM);
          const f64Len = reader.uint32();
          assertTrue(f64Len % 8 === 0);
          const f64Words = f64Len / 8;
          const f64Off = batchBytes.byteOffset + reader.pos;
          if (f64Off % 8 === 0) {
            this.float64Cells = new Float64Array(
              batchBytes.buffer,
              f64Off,
              f64Words,
            );
          } else {
            // Production trace_processor.wasm output should always be
            // 8-byte aligned; this slow path only matters for edge cases.
            const slice = batchBytes.buffer.slice(f64Off, f64Off + f64Len);
            this.float64Cells = new Float64Array(slice);
          }
          reader.pos += f64Len;
          break;
        }

        case 4: // blob_cells: one entry per blob.
          assertTrue((tag & 7) === TAG_LEN_DELIM);
          this.blobCells.push(new Uint8Array(reader.bytes()));
          break;

        case 5: {
          // string_cells: all string cells concatenated with \0 separators.
          assertTrue((tag & 7) === TAG_LEN_DELIM);
          const strLen = reader.uint32();
          assertTrue(reader.pos + strLen <= end);
          const subArr = batchBytes.subarray(reader.pos, reader.pos + strLen);
          this.stringCells = new TextDecoder().decode(subArr).split('\0');
          reader.pos += strLen;
          break;
        }

        case 6: // is_last_batch
          this.isLastBatch = !!reader.bool();
          break;

        default:
          reader.skipType(tag & 7);
          break;
      }
    }
  }

  get numCells() {
    return this.cellTypesLen;
  }
}

class RowIteratorImpl implements RowIteratorBase {
  readonly rowSpec: Row;
  rowData: Row;

  private resultObj: QueryResultImpl;
  private batchIdx = -1;
  private batchBytes = new Uint8Array();
  private columnNames: string[] = [];
  private numColumns = 0;
  private cellTypesEnd = -1; // -1 so the 1st next() hits tryMoveToNextBatch().
  private float64Cells = new Float64Array();
  private varIntReader = protobuf.Reader.create(this.batchBytes);
  private blobCells: Uint8Array[] = [];
  private stringCells: string[] = [];

  private nextCellTypeOff = 0;
  private nextFloat64Cell = 0;
  private nextStringCell = 0;
  private nextBlobCell = 0;
  private isValid = false;

  constructor(querySpec: Row, rowData: Row, res: QueryResultImpl) {
    Object.assign(this, querySpec);
    this.rowData = rowData;
    this.rowSpec = {...querySpec};
    this.resultObj = res;
    this.next();
  }

  valid(): boolean {
    return this.isValid;
  }

  private makeError(message: string): QueryError {
    return new QueryError(message, this.resultObj.errorInfo);
  }

  get(columnName: string): SqlValue {
    const res = this.rowData[columnName];
    if (res === undefined) {
      throw this.makeError(
        `Column '${columnName}' doesn't exist. ` +
          `Actual columns: [${this.columnNames.join(',')}]`,
      );
    }
    return res;
  }

  next() {
    while (this.nextCellTypeOff + this.numColumns > this.cellTypesEnd) {
      assertTrue(
        this.nextCellTypeOff === this.cellTypesEnd || this.cellTypesEnd === -1,
      );
      if (!this.tryMoveToNextBatch()) {
        this.isValid = false;
        return;
      }
    }

    const rowData = this.rowData;
    const numColumns = this.numColumns;

    for (let i = 0; i < numColumns; i++) {
      const cellType = this.batchBytes[this.nextCellTypeOff++];
      const colName = this.columnNames[i];
      const expType = this.rowSpec[colName];

      switch (cellType) {
        case CellType.CELL_NULL:
          rowData[colName] = null;
          break;

        case CellType.CELL_VARINT:
          if (expType === NUM || expType === NUM_NULL) {
            const val = this.varIntReader.int64();
            rowData[colName] = val as unknown as number;
          } else {
            const value = decodeInt64Varint(
              this.batchBytes,
              this.varIntReader.pos,
            );
            rowData[colName] = value;
            this.varIntReader.skip();
          }
          break;

        case CellType.CELL_FLOAT64:
          rowData[colName] = this.float64Cells[this.nextFloat64Cell++];
          break;

        case CellType.CELL_STRING:
          rowData[colName] = this.stringCells[this.nextStringCell++];
          break;

        case CellType.CELL_BLOB:
          rowData[colName] = this.blobCells[this.nextBlobCell++];
          break;

        default:
          throw this.makeError(`Invalid cell type ${cellType}`);
      }
    }
    this.isValid = true;
  }

  private tryMoveToNextBatch(): boolean {
    const nextBatchIdx = this.batchIdx + 1;
    if (nextBatchIdx >= this.resultObj.batches.length) {
      return false;
    }

    this.columnNames = this.resultObj.columnNames;
    this.numColumns = this.columnNames.length;

    this.batchIdx = nextBatchIdx;
    const batch = ensureExists(this.resultObj.batches[nextBatchIdx]);
    this.batchBytes = batch.batchBytes;
    this.nextCellTypeOff = batch.cellTypesOff;
    this.cellTypesEnd = batch.cellTypesOff + batch.cellTypesLen;
    this.float64Cells = batch.float64Cells;
    this.blobCells = batch.blobCells;
    this.stringCells = batch.stringCells;
    this.varIntReader = protobuf.Reader.create(batch.batchBytes);
    this.varIntReader.pos = batch.varintOff;
    this.varIntReader.len = batch.varintOff + batch.varintLen;
    this.nextFloat64Cell = 0;
    this.nextStringCell = 0;
    this.nextBlobCell = 0;

    for (const expectedCol of Object.keys(this.rowSpec)) {
      if (this.columnNames.indexOf(expectedCol) < 0) {
        throw this.makeError(
          `Column ${expectedCol} not found in the SQL result ` +
            `set {${this.columnNames.join(' ')}}`,
        );
      }
    }

    const numColumns = this.numColumns;
    if (batch.numCells === 0) {
      assertTrue(batch.isLastBatch);
      return false;
    }

    assertTrue(numColumns > 0);
    for (let i = this.nextCellTypeOff; i < this.cellTypesEnd; i++) {
      const col = (i - this.nextCellTypeOff) % numColumns;
      const colName = this.columnNames[col];
      const actualType = this.batchBytes[i] as CellType;
      const expType = this.rowSpec[colName];
      if (expType === undefined) continue;

      let err = '';
      if (!isCompatible(actualType, expType)) {
        if (actualType === CellType.CELL_NULL) {
          err =
            'SQL value is NULL but that was not expected' +
            ` (expected type: ${columnTypeToString(expType)}). ` +
            'Did you mean NUM_NULL, LONG_NULL, STR_NULL or BLOB_NULL?';
        } else {
          err = `Incompatible cell type. Expected: ${columnTypeToString(
            expType,
          )} actual: ${CELL_TYPE_NAMES[actualType]}`;
        }
      }
      if (err.length > 0) {
        const row = Math.floor(i / numColumns);
        throw this.makeError(`Error @ row: ${row} col: '${colName}': ${err}`);
      }
    }
    return true;
  }
}

class RowIteratorImplWithRowData implements RowIteratorBase {
  private _impl: RowIteratorImpl;

  next: () => void;
  valid: () => boolean;
  get: (columnName: string) => SqlValue;

  constructor(querySpec: Row, res: QueryResultImpl) {
    const thisAsRow = this as unknown as Row;
    Object.assign(thisAsRow, querySpec);
    this._impl = new RowIteratorImpl(querySpec, thisAsRow, res);
    this.next = this._impl.next.bind(this._impl);
    this.valid = this._impl.valid.bind(this._impl);
    this.get = this._impl.get.bind(this._impl);
  }
}

// Await-able proxy around QueryResultImpl: `await engine.query(...)` awaits
// all rows; callers that want to stream can use the WritableQueryResult
// interface directly instead.
class WaitableQueryResultImpl
  implements QueryResult, WritableQueryResult, PromiseLike<QueryResult>
{
  private impl: QueryResultImpl;
  private thenCalled = false;

  constructor(errorInfo: QueryErrorInfo) {
    this.impl = new QueryResultImpl(errorInfo);
  }

  iter<T extends Row>(spec: T) {
    return this.impl.iter(spec);
  }
  firstRow<T extends Row>(spec: T) {
    return this.impl.firstRow(spec);
  }
  maybeFirstRow<T extends Row>(spec: T) {
    return this.impl.maybeFirstRow(spec);
  }
  waitAllRows() {
    return this.impl.waitAllRows();
  }
  isComplete() {
    return this.impl.isComplete();
  }
  numRows() {
    return this.impl.numRows();
  }
  columns() {
    return this.impl.columns();
  }
  error() {
    return this.impl.error();
  }
  elapsedTimeMs() {
    return this.impl.elapsedTimeMs();
  }

  appendResultBatch(resBytes: Uint8Array<ArrayBuffer>) {
    return this.impl.appendResultBatch(resBytes);
  }

  ensureAllRowsPromise(): Promise<QueryResult> {
    return this.impl.waitAllRows();
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): PromiseLike<TResult1 | TResult2> {
    assertFalse(this.thenCalled);
    this.thenCalled = true;
    return this.ensureAllRowsPromise().then(onfulfilled, onrejected);
  }
}

export function createQueryResult(
  errorInfo: QueryErrorInfo,
): QueryResult & PromiseLike<QueryResult> & WritableQueryResult {
  return new WaitableQueryResultImpl(errorInfo);
}
