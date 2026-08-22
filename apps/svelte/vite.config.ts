import {defineConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {fileURLToPath} from 'node:url';

// Relative asset paths so the same build works unmodified whether it's
// served from /svelte/ at the site root or nested under a PR preview at
// /pr-preview/pr-<n>/svelte/.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  // See apps/vanilla/vite.config.ts for why this points at vendor/.
  publicDir: fileURLToPath(new URL('../../vendor/trace_processor', import.meta.url)),
});
