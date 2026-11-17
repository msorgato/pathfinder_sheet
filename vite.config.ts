import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'

// One identifier per build, shared by the app (define) and the published version.json,
// so a running app can tell whether a newer build is online.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now())

const versionFile = (): Plugin => ({
  name: 'version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) })
  },
})

export default defineConfig({
  define: { __APP_BUILD__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    tailwindcss(),
    versionFile(),
    VitePWA({
      // A new version waits until the user accepts it (see lib/pwaUpdate)
      registerType: 'prompt',
      injectRegister: false,
      devOptions: { enabled: false },
      includeAssets: ['icons/*.png', 'icons/classi/*.svg'],
      manifest: {
        name: 'Pathfinder Sheet',
        short_name: 'Pathfinder',
        description: 'Schede personaggio per Pathfinder',
        lang: 'it',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0f0c1e',
        background_color: '#0f0c1e',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        // SPA routes load the cached shell; Firebase auth handler routes must reach the network.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
        // The waiting worker only activates when the user accepts (or the app is closed); it then takes over the open page
        clientsClaim: true,
        // Firestore, Auth and Cloud Functions are cross-origin and have no runtime rule: always network.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
