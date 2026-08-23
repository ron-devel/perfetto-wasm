import {defineConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {fileURLToPath} from 'node:url';
import {VitePWA} from 'vite-plugin-pwa';
import {viteStaticCopy} from 'vite-plugin-static-copy';

// Relative asset paths so the same build works unmodified whether it's
// served from /svelte/ at the site root or nested under a PR preview at
// /pr-preview/pr-<n>/svelte/.
export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    // publicDir is already spoken for (vendor wasm, below) -- copy the
    // shared PWA icons into dist ourselves instead of fighting Vite over
    // a second public directory.
    viteStaticCopy({
      targets: [{src: '../../assets/pwa-icons/*', dest: '.', rename: {stripBase: true}}],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-192.png',
        'icon-maskable-512.png',
      ],
      manifest: {
        name: 'Perfetto Trace Query (Svelte)',
        short_name: 'Trace Query',
        description:
          'Load a Perfetto trace and query it with SQL, entirely in your browser -- installable, and works offline after the first visit.',
        theme_color: '#1e1b4b',
        background_color: '#1e1b4b',
        display: 'standalone',
        start_url: '.',
        scope: './',
        icons: [
          {src: 'icon-192.png', sizes: '192x192', type: 'image/png'},
          {src: 'icon-512.png', sizes: '512x512', type: 'image/png'},
          {
            src: 'icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // See apps/vanilla/vite.config.ts -- trace_processor.wasm is
        // ~13MB, well past Workbox's 2MB default precache limit.
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,wasm,svg,png}'],
      },
    }),
  ],
  // See apps/vanilla/vite.config.ts for why this points at vendor/.
  publicDir: fileURLToPath(new URL('../../vendor/trace_processor', import.meta.url)),
});
