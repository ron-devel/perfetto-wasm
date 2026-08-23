import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")


@app.cell(hide_code=True)
def _():
    import marimo as mo

    mo.md(
        """
        # Perfetto trace query, in a client-side notebook

        Pick a trace file below (it's parsed entirely in your browser by
        `trace_processor.wasm` — nothing is uploaded anywhere). Each
        `run_query()` call below gets its own independent result: run as
        many different queries as you like and pull out each one's own
        DataFrame separately, without any of them overwriting each other.

        This widget is also designed to work in a fully static, exported
        page (Python itself running via Pyodide in the browser too — so
        both the notebook and the trace engine end up as WebAssembly in
        the same tab, no server involved anywhere) -- see
        `marimo_demo_wasm.py` for that variant. This notebook itself
        can't be exported as-is: `marimo export html-wasm` needs every
        import to be installable in the browser via micropip, and
        `perfetto_trace_widget` isn't published to PyPI yet.
        """
    )
    return (mo,)


@app.cell
def _(mo):
    from perfetto_trace_widget import PerfettoTraceWidget

    widget = mo.ui.anywidget(PerfettoTraceWidget())
    widget
    return (widget,)


@app.cell(hide_code=True)
def _(mo, widget):
    mo.md(f"**Error:** `{widget.error}`" if widget.error else f"_{widget.status}_")
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""## Query 1: top slice names by count""")
    return


@app.cell
def _(mo):
    # A run_button's `.value` is only True on the run its own click
    # triggered -- it reads back False on any later, unrelated reactive
    # rerun. Since the cell below also depends on `widget` (it calls
    # `widget.run_query`), *every* widget trait change (e.g. the async
    # result landing in `results_json`) reruns it too -- so the id has to
    # live in `mo.state()` and only ever be *set* inside an `if` guard,
    # never reassigned unconditionally, or that later rerun would wipe it
    # back to None right as the result arrives.
    get_top_slices_id, set_top_slices_id = mo.state(None)
    return get_top_slices_id, set_top_slices_id


@app.cell
def _(mo):
    run_top_slices = mo.ui.run_button(label="Run")
    run_top_slices
    return (run_top_slices,)


@app.cell
def _(run_top_slices, set_top_slices_id, widget):
    if run_top_slices.value:
        set_top_slices_id(
            widget.run_query(
                "select name, count(*) as n\n"
                "from slice\n"
                "group by name\n"
                "order by n desc\n"
                "limit 10"
            )
        )
    return


@app.cell
def _(get_top_slices_id, widget):
    _id = get_top_slices_id()
    widget.to_dataframe(_id) if _id else None
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(
        """
        ### Same result, charted

        [pyobsplot](https://juba.github.io/pyobsplot/) wraps Observable
        Plot as its own anywidget -- it takes the polars DataFrame from
        `to_dataframe()` directly (no pandas conversion needed) and
        renders straight from it, so this chart updates the same way the
        table above does: re-run the cell above's query and this one
        picks up the new result on its own.

        (If this shows a red "missing a default export" error instead of
        a chart, that's a known intermittent race in marimo's own
        anywidget module loader on pyobsplot's ~1.4MB bundle -- unrelated
        to this widget. Re-running the cell below clears it.)
        """
    )
    return


@app.cell
def _(get_top_slices_id, widget):
    from pyobsplot import Plot

    _id = get_top_slices_id()
    _df = widget.to_dataframe(_id) if _id else None
    (
        Plot.plot(
            {
                "marks": [Plot.barX(_df, {"x": "n", "y": "name", "sort": {"y": "-x"}})],
                "marginLeft": 140,
                "x": {"label": "count"},
                "y": {"label": None},
            }
        )
        if _df is not None and _df.height > 0
        else None
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md("""## Query 2: threads, independent of query 1's result above""")
    return


@app.cell
def _(mo):
    get_threads_id, set_threads_id = mo.state(None)
    return get_threads_id, set_threads_id


@app.cell
def _(mo):
    run_threads = mo.ui.run_button(label="Run")
    run_threads
    return (run_threads,)


@app.cell
def _(run_threads, set_threads_id, widget):
    if run_threads.value:
        set_threads_id(widget.run_query("select utid, tid, name from thread limit 10"))
    return


@app.cell
def _(get_threads_id, widget):
    _id = get_threads_id()
    widget.to_dataframe(_id) if _id else None
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(
        """
        ## Everything so far

        `to_dataframes()` returns every query's result to date, keyed by
        its query_id — handy once you've fired off several.
        """
    )
    return


@app.cell
def _(widget):
    widget.to_dataframes()
    return


if __name__ == "__main__":
    app.run()
