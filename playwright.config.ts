import { defineConfig, devices } from '@playwright/test'

// Recorridos y capturas en un móvil simulado, sobre la app ya construida.
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4174',
    ...devices['iPhone 13'],
    defaultBrowserType: 'chromium',
    locale: 'es-ES',
  },
  webServer: {
    // Sin las rutinas privadas, igual que en la CI (no están en el repositorio)
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    env: { VITE_NO_LOCAL_PROGRAMS: '1' },
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
