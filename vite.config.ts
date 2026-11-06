import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      // «prompt»: la versión nueva espera; la app decide cuándo aplicarla (nunca durante un entreno).
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'MUTA',
        short_name: 'MUTA',
        description: 'Tu entrenamiento, tu comida y tu progreso.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // La app se guarda en el móvil al instalarla: abre sin cobertura en el gimnasio. Lo grande (las fotos del recetario y
        // los productos de supermercado) se guarda la primera vez que se usa, para que instalar sea rápido.
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        globIgnores: ['**/foods-super-*.js', '**/foods-super-*.json'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.(webp|js|json)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'muta-grande', expiration: { maxEntries: 300 } },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'], // los recorridos de tests/e2e los pasa Playwright
    // Sin las rutinas ni la biblioteca locales (private/): las pruebas dan lo mismo aquí que en la CI
    env: { VITE_NO_LOCAL_PROGRAMS: '1' },
  },
})
