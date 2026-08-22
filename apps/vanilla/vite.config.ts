import {defineConfig} from 'vite';

// Relative asset paths so the same build works unmodified whether it's
// served from the site root, a /svelte/ sibling, or a PR preview nested
// under /pr-preview/pr-<n>/.
export default defineConfig({
  base: './',
});
