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
anywidget's normal trait sync -- see `columns_json`.
"""

from __future__ import annotations

import json
import pathlib

import anywidget
import pandas as pd
import traitlets

_STATIC_DIR = pathlib.Path(__file__).parent / "static"


class PerfettoTraceWidget(anywidget.AnyWidget):
    """Displays a file picker; once a trace is loaded, `run_query()` runs
    SQL against it (in the browser) and `to_dataframe()` gets you the
    result as a pandas DataFrame.

    Example:
        >>> widget = PerfettoTraceWidget()
        >>> widget  # display it, pick a trace file in its UI
        >>> widget.run_query("select name, dur from slice limit 10")
        >>> widget.to_dataframe()  # once the (async, in-browser) query has
        ...                        # finished -- see run_query()'s docstring
    """

    _esm = _STATIC_DIR / "widget.js"

    # Set by run_query(); the JS side watches _query_seq (not sql directly)
    # so that calling run_query() twice with the same SQL still re-runs it.
    sql = traitlets.Unicode("").tag(sync=True)
    _query_seq = traitlets.Int(0).tag(sync=True)

    # Read-only from Python's perspective -- written by the JS side.
    status = traitlets.Unicode("idle").tag(sync=True)
    error = traitlets.Unicode("").tag(sync=True)
    columns_json = traitlets.Unicode("[]").tag(sync=True)
    row_count = traitlets.Int(0).tag(sync=True)

    # Where the JS side fetches trace_processor.wasm / trace_processor.js
    # from. Empty string means "use the widget's own built-in default"
    # (this project's published demo deployment) -- set this if you're
    # self-hosting the wasm, e.g. for an offline/air-gapped export.
    wasm_base_url = traitlets.Unicode("").tag(sync=True)

    def run_query(self, sql: str) -> "PerfettoTraceWidget":
        """Runs `sql` against the trace loaded in the widget's browser UI.

        This is fire-and-forget from Python's side: it sets a trait, the
        browser picks that up, runs the query against trace_processor.wasm
        (async), and writes the result back into `columns_json`/`row_count`/
        `error` as further trait updates. In a reactive notebook (marimo's
        `mo.ui.anywidget(widget)`, or plain ipywidgets observing these
        traits), a cell reading `to_dataframe()` naturally re-runs once
        those come back -- there's no explicit "await" here because none of
        this crosses back into the Python *process* synchronously; it's the
        same async-over-a-comm-channel pattern any interactive widget uses
        (a slider's `.value` isn't "final" the instant you call `.set()`
        either).
        """
        self.sql = sql
        self._query_seq += 1
        return self

    def to_dataframe(self) -> pd.DataFrame:
        """Parses the current `columns_json` into a DataFrame. Empty until
        a query has actually completed -- check `.error` if this is
        unexpectedly empty.
        """
        columns = json.loads(self.columns_json)
        if not columns:
            return pd.DataFrame()
        df = pd.DataFrame({c["name"]: c["values"] for c in columns})
        # trace_processor's 64-bit int/long columns cross the JS<->Python
        # boundary as strings (JSON has no bigint) -- restore numeric dtype
        # where every value in a column actually parses as one. Columns
        # that are genuinely text (or NULL-containing and non-numeric) are
        # left untouched.
        for name in df.columns:
            coerced = pd.to_numeric(df[name], errors="coerce")
            if coerced.notna().equals(df[name].notna()):
                df[name] = coerced
        return df
