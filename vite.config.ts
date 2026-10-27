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
        // Todo se guarda en el móvil: la app abre sin cobertura en el gimnasio.
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'], // los recorridos de tests/e2e los pasa Playwright
  },
})
