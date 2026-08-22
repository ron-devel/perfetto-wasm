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
        `trace_processor.wasm` — nothing is uploaded anywhere), then edit
        the SQL query in the next cell.

        This notebook is designed to also work exported as a fully static
        page: `marimo export html-wasm examples/marimo_demo.py -o demo.html`.
        In that mode Python itself runs via Pyodide in your browser too —
        so both the notebook and the trace engine end up running as
        WebAssembly in the same tab, no server involved anywhere.
        """
    )
    return (mo,)


@app.cell
def _(mo):
    from perfetto_trace_widget import PerfettoTraceWidget

    widget = mo.ui.anywidget(PerfettoTraceWidget())
    widget
    return (widget,)


@app.cell
def _(mo):
    sql = mo.ui.text_area(
        value="select name, count(*) as n\nfrom slice\ngroup by name\norder by n desc\nlimit 10",
        label="SQL",
        full_width=True,
    )
    run_button = mo.ui.run_button(label="Run query")
    mo.hstack([run_button], justify="start")
    return run_button, sql


@app.cell
def _(run_button, sql, widget):
    if run_button.value:
        widget.run_query(sql.value)
    return


@app.cell(hide_code=True)
def _(mo, widget):
    mo.md(f"**Error:** `{widget.error}`" if widget.error else f"_{widget.status}_")
    return


@app.cell
def _(widget):
    df = widget.to_dataframe()
    df
    return (df,)


if __name__ == "__main__":
    app.run()
