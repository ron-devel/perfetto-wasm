import {defineConfig} from 'vite';

// Builds a single self-contained ESM file (worker inlined as a blob URL —
// see perfetto_engine.ts) directly into the Python package's static/
// directory, which is what anywidget's `_esm` reads. Single-file output
// matters because the marimo `html-wasm` export target this widget is
// built for has no dev server to resolve a second script from.
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'widget.js',
    },
    outDir: '../src/perfetto_trace_widget/static',
    minify: true,
  },
});
