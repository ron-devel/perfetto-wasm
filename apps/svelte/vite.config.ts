import {defineConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';

// Relative asset paths so the same build works unmodified whether it's
// served from /svelte/ at the site root or nested under a PR preview at
// /pr-preview/pr-<n>/svelte/.
export default defineConfig({
  base: './',
  plugins: [svelte()],
});
