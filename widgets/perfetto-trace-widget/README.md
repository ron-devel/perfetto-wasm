# perfetto-trace-widget

A [Perfetto](https://perfetto.dev) trace-processor widget for
[anywidget](https://anywidget.dev): load a trace file in the browser
(`trace_processor.wasm`, in a Web Worker), run SQL against it, and get each
query's result as its own polars DataFrame in Python — with **no server on
the Python side**. The trace is parsed and queried entirely client-side;
only query results (typically small) cross the Python↔JS boundary. Run as
many independent queries as you like against the same loaded trace: each
gets its own query id and its own DataFrame, so none of them overwrite each
other.

That "no server" property is the whole point: this widget works inside
[marimo's `export html-wasm`](https://docs.marimo.io/guides/exporting/#export-to-wasm-powered-html)
(a notebook exported to a fully client-side page — Python itself runs via
Pyodide, no backend at all) exactly as well as it works in a normal
Jupyter/marimo session with a real Python process. Both the notebook's
Python *and* the trace query engine end up running as WebAssembly in the
same browser tab.

This package is self-contained and independent of the rest of the
[`perfetto-wasm`](https://github.com/ron-devel/perfetto-wasm) monorepo it
lives in (it just happens to be developed alongside the demo apps that
share its underlying engine code) — nothing about installing or using it
requires the rest of that repo.

## Install

```sh
pip install perfetto-trace-widget
```

(Not yet published to PyPI — for now, install from source: see
[Developing](#developing) below, or `pip install
"perfetto-trace-widget @ git+https://github.com/ron-devel/perfetto-wasm.git#subdirectory=widgets/perfetto-trace-widget"`.)

## Usage

```python
from perfetto_trace_widget import PerfettoTraceWidget

widget = PerfettoTraceWidget()
widget  # display it (Jupyter/marimo/Colab) — pick a trace file in its UI

# once a trace is loaded in the widget:
q1 = widget.run_query("select name, dur from slice order by dur desc limit 10")
q2 = widget.run_query("select name from thread")  # independent of q1

widget.to_dataframe(q1)  # this query's own DataFrame
widget.to_dataframe(q2)  # unaffected by q1

widget.to_dataframes()  # {query_id: DataFrame} for every query run so far
```

`run_query()` is fire-and-forget: it tells the browser side to run the
query and returns a `query_id` immediately, before the (async, in-browser)
result is back — see its docstring. In a reactive notebook (marimo, or
plain ipywidgets code observing the widget's traits) that's not a problem:
a cell that calls `to_dataframe(query_id)` naturally re-runs once that
query's result actually lands. In a plain script or a one-shot Jupyter
cell, you'll need to wait for it yourself (poll `widget.status` or
`widget.error`, or just re-run the cell after the UI shows a row count).
`to_dataframe()` returns an empty DataFrame for a `query_id` whose result
hasn't landed yet, and raises `RuntimeError` if that query itself failed
(e.g. a SQL error) — trace *loading* failures surface separately, via
`widget.error`.

### marimo

```python
import marimo as mo
from perfetto_trace_widget import PerfettoTraceWidget

widget = mo.ui.anywidget(PerfettoTraceWidget())
widget  # cell 1: display, pick a trace file

query_id = widget.run_query(
    "select name, count(*) as n from slice group by name order by n desc limit 10"
)  # cell 2

widget.to_dataframe(query_id)  # cell 3: re-runs once this query's result lands
```

If a query is triggered from a button (`mo.ui.run_button()`), store its
`query_id` in `mo.state()` rather than reassigning a plain variable: the
cell that calls `run_query()` also depends on `widget` (since it reads
`widget.run_query`), so it reruns again once the async result lands and
changes one of the widget's synced traits — at which point an unguarded
`query_id = widget.run_query(...) if button.value else None` would
reset back to `None`, because `button.value` is only `True` on the run its
own click triggered. Guard the call with `if button.value:` and only set
the state inside that block, so a later, unrelated rerun leaves the
previously-set id alone. See
[`examples/marimo_demo.py`](examples/marimo_demo.py) for a complete
notebook using this pattern for two independent queries, including how to
`marimo export html-wasm` it into a fully static, shareable page.

### Configuring where the wasm comes from

By default the widget fetches `trace_processor.wasm`/`.js` from this
project's published demo deployment
(`https://ron-devel.github.io/perfetto-wasm/`). For an offline export, or
to pin a specific build, self-host those two files and point the widget at
them:

```python
widget = PerfettoTraceWidget(wasm_base_url="https://your-host.example/trace_processor/")
```

## Developing

```sh
cd js && npm install && npm run build   # builds src/perfetto_trace_widget/static/widget.js
pip install -e .
```

The built `widget.js` is committed (not generated at install time) so
`pip install` doesn't require Node.js — rebuild it with the commands above
after editing anything under `js/src/`.

`js/src/engine/` is a deliberate copy of this monorepo's
`packages/engine/src/internal` (the trace_processor RPC client), not a
dependency — see [`js/src/engine/README.md`](js/src/engine/README.md) for
why, and keep both in sync by hand if you fix a bug in one.
