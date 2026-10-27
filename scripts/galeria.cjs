// npm run galeria: captura todas las pantallas y las junta en tests/e2e/capturas/galeria/galeria.html
const { execSync } = require('child_process')
execSync('npx playwright test zz-galeria', { stdio: 'inherit', env: { ...process.env, GALERIA: '1' } })
require('./galeria-html.cjs')
