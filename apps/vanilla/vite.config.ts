import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {VitePWA} from 'vite-plugin-pwa';
import {viteStaticCopy} from 'vite-plugin-static-copy';

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
  plugins: [
    // publicDir is already spoken for (vendor wasm, above) -- copy the
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
        name: 'Perfetto Trace Query',
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
        // trace_processor.wasm is ~13MB, well past Workbox's 2MB default
        // precache limit -- raise it so the engine itself is cached too,
        // not just the app shell (defeats the point of "offline" if the
        // wasm still has to hit the network on every load).
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,wasm,svg,png}'],
      },
    }),
  ],
});
