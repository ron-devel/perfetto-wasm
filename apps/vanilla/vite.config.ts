import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

// Relative asset paths so the same build works unmodified whether it's
// served from the site root, a /svelte/ sibling, or a PR preview nested
// under /pr-preview/pr-<n>/.
export default defineConfig({
  base: './',
  // Serves (and copies into dist/ on build) whatever vendor-wasm.yml has
  // written to vendor/trace_processor/ — trace_processor.wasm and its JS
  // loader, fetched/imported at runtime by packages/engine. Empty (just
  // .gitkeep) until that workflow has run once; see packages/engine's
  // EngineNotReadyError for how that shows up in the UI until then.
  publicDir: fileURLToPath(new URL('../../vendor/trace_processor', import.meta.url)),
});
