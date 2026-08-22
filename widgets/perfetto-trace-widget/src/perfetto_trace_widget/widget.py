"""A Perfetto trace-processor query widget.

The browser side (see ../../js/src/index.ts) loads trace_processor.wasm,
lets the user pick a trace file from a plain <input type=file>, and runs
SQL against it entirely client-side (a Web Worker running the wasm engine)
-- no server, no Python-side trace parsing. That's what makes this widget
work inside a fully client-side notebook export (e.g. marimo's
`export html-wasm`, which runs the Python kernel itself via Pyodide with no
backend at all): the trace never has to leave the browser, and neither does
the query engine.

Only query *results* cross the Python<->JS boundary, as plain JSON via
anywidget's normal comm channel -- see `results_json`. Each query gets its
own id and its own entry in that dict, so running several queries never
clobbers an earlier one's result -- see run_query()'s docstring.
"""

from __future__ import annotations

import json
import pathlib

import anywidget
import polars as pl
import traitlets

_STATIC_DIR = pathlib.Path(__file__).parent / "static"

_DTYPE_MAP = {
    "int64": pl.Int64,
    "float64": pl.Float64,
    "bytes": pl.Binary,
}


def _columns_to_dataframe(columns: list[dict]) -> pl.DataFrame:
    """Builds a DataFrame from JS-serialized columns, each tagged with a
    dtype inferred from its actual cell types (see classifyColumn() in
    index.ts) -- rather than guessing dtypes after the fact, the way plain
    `pl.DataFrame(json.loads(...))` would. Unlike pandas, polars needs no
    special "nullable" dtype variant: every dtype natively supports null.
    """
    series = []
    for col in columns:
        name, dtype, values = col["name"], col["dtype"], col["values"]
        if dtype == "int64":
            # JS serializes bigint as a decimal string (JSON has no bigint)
            # -- convert back before handing polars an Int64 dtype.
            values = [None if v is None else int(v) for v in values]
        elif dtype == "bytes":
            values = [None if v is None else bytes(v) for v in values]
        series.append(pl.Series(name, values, dtype=_DTYPE_MAP.get(dtype)))
    return pl.DataFrame(series)


class PerfettoTraceWidget(anywidget.AnyWidget):
    """Displays a file picker; once a trace is loaded, `run_query()` runs
    SQL against it (in the browser) and `to_dataframe(query_id)` gets you
    that query's result as its own polars DataFrame -- independent of any
    other query you've run against the same widget.

    Example:
        >>> widget = PerfettoTraceWidget()
        >>> widget  # display it, pick a trace file in its UI
        >>> q1 = widget.run_query("select name, dur from slice limit 10")
        >>> q2 = widget.run_query("select name from thread")
        >>> widget.to_dataframe(q1)  # once the (async, in-browser) query
        ...                          # has finished -- see run_query()'s
        ...                          # docstring
        >>> widget.to_dataframe(q2)  # independent result, same widget
    """

    _esm = _STATIC_DIR / "widget.js"

    # Read-only from Python's perspective -- written by the JS side.
    status = traitlets.Unicode("idle").tag(sync=True)
    error = traitlets.Unicode("").tag(sync=True)  # trace *loading* errors
    results_json = traitlets.Unicode("{}").tag(sync=True)  # {query_id: {...}}

    # Where the JS side fetches trace_processor.wasm / trace_processor.js
    # from. Empty string means "use the widget's own built-in default"
    # (this project's published demo deployment) -- set this if you're
    # self-hosting the wasm, e.g. for an offline/air-gapped export.
    wasm_base_url = traitlets.Unicode("").tag(sync=True)

    def __init__(self, *args: object, **kwargs: object) -> None:
        super().__init__(*args, **kwargs)
        self._query_counter = 0

    def run_query(self, sql: str) -> str:
        """Runs `sql` against the trace loaded in the widget's browser UI.
        Returns a query_id; pass it to `to_dataframe()` to get this
        specific query's result once it lands.

        This is fire-and-forget from Python's side: it sends a message to
        the browser and returns immediately, before the (async, in-browser)
        result comes back. In a reactive notebook (marimo's
        `mo.ui.anywidget(widget)`, or plain ipywidgets code observing
        `results_json`) that's not a problem: a cell calling
        `to_dataframe(query_id)` naturally re-runs once that id's result
        actually lands in `results_json` -- there's no explicit "await"
        here because none of this crosses back into the Python *process*
        synchronously; it's the same async-over-a-comm-channel pattern any
        interactive widget uses (a slider's `.value` isn't "final" the
        instant you call `.set()` either).

        Each call gets a distinct query_id (even for identical SQL), so
        running the same query twice keeps both results available.
        """
        self._query_counter += 1
        query_id = f"q{self._query_counter}"
        self.send({"type": "run_query", "query_id": query_id, "sql": sql})
        return query_id

    def to_dataframe(self, query_id: str) -> pl.DataFrame:
        """The result of the query previously started by
        `run_query() -> query_id`, as its own DataFrame -- independent of
        any other query's result on this widget.

        Returns an empty DataFrame if `query_id`'s result hasn't landed
        yet (or is unknown). Raises `RuntimeError` if that specific query
        failed (e.g. a SQL error) -- check `error` for trace *loading*
        failures instead, which aren't per-query.
        """
        results = json.loads(self.results_json)
        entry = results.get(query_id)
        if entry is None:
            return pl.DataFrame()
        if entry.get("error"):
            raise RuntimeError(entry["error"])
        return _columns_to_dataframe(entry["columns"])

    def to_dataframes(self) -> dict[str, pl.DataFrame]:
        """Every query_id that has a result so far (successful or not --
        see `to_dataframe()`'s docstring for how failures surface), as
        `{query_id: DataFrame}`. Convenient after firing off several
        queries at once when you want whichever are ready.
        """
        results = json.loads(self.results_json)
        out = {}
        for query_id, entry in results.items():
            out[query_id] = (
                _columns_to_dataframe(entry["columns"])
                if not entry.get("error")
                else pl.DataFrame()
            )
        return out
