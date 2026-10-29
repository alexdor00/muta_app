// Guardas del proyecto: lo mecánico de CLAUDE.md y de la arquitectura que el linter no comprueba.
// Se ejecuta con `npm run guardas` y en la CI. Sale con error si algo falla.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const walk = (dir) =>
  fs
    .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]))

const errors = []
const fail = (message) => errors.push(message)

// 1. Los datos privados no están en git ni sin ignorar
const tracked = execFileSync('git', ['ls-files', 'private'], { cwd: ROOT, encoding: 'utf8' }).trim()
if (tracked) fail(`private/ tiene archivos en git:\n  ${tracked.split('\n').join('\n  ')}`)
if (!/^private\/?$/m.test(read('.gitignore'))) fail('.gitignore no ignora private/')

const src = walk('src').filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))

// 2. Un dato, una fuente: los tipos de un programa se declaran solo en domain/program.ts
const SINGLE = /^(?:export )?type (Exercise|Day|Week|Block|ProgramData|Session|RestDay)\b/m
for (const file of src) {
  if (file === 'src/features/training/domain/program.ts') continue
  if (SINGLE.test(read(file))) fail(`${file}: declara un tipo de programa; importarlo de domain/program.ts`)
}

// 3. Sin `as never` ni `any`
for (const file of src) {
  const text = read(file)
  if (/\bas never\b/.test(text)) fail(`${file}: usa «as never»`)
  if (/:\s*any\b|\bas any\b/.test(text)) fail(`${file}: usa «any»`)
}

// 4. Cada archivo de dominio con funciones o constantes tiene su prueba
for (const file of src.filter((f) => /^src\/features\/[^/]+\/domain\/[^/]+\.ts$/.test(f))) {
  if (!/^export (?:async )?(?:function|const) /m.test(read(file))) continue
  if (!fs.existsSync(path.join(ROOT, file.replace(/\.ts$/, '.test.ts'))))
    fail(`${file}: sin archivo de pruebas`)
}

// 5. Ningún archivo de código pasa de 400 líneas
for (const file of src) {
  const lines = read(file).split('\n').length
  if (lines > 400) fail(`${file}: ${lines} líneas (máximo 400)`)
}

// 6. Documentación: existe, el CLAUDE.md raíz cabe en 120 líneas y los enlaces llevan a algún sitio
for (const doc of ['CLAUDE.md', 'TAREAS.md', 'docs/arquitectura.md', 'docs/decisiones.md']) {
  if (!fs.existsSync(path.join(ROOT, doc))) fail(`falta ${doc}`)
}
const rootDoc = read('CLAUDE.md')
const rootLines = rootDoc.replace(/\n$/, '').split('\n').length
if (rootLines > 120) fail(`CLAUDE.md tiene ${rootLines} líneas (máximo 120): mover detalle a docs/`)

const docs = [
  'CLAUDE.md',
  'TAREAS.md',
  ...walk('docs').filter((f) => f.endsWith('.md')),
  ...walk('src').filter((f) => f.endsWith('CLAUDE.md')),
  'tests/e2e/CLAUDE.md',
]
for (const doc of new Set(docs)) {
  if (!fs.existsSync(path.join(ROOT, doc))) continue
  for (const [, target] of read(doc).matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    if (/^(https?:|mailto:)/.test(target)) continue
    if (!fs.existsSync(path.resolve(ROOT, path.dirname(doc), target))) fail(`${doc}: enlace roto → ${target}`)
  }
}

// 7. Cada área con código (use-cases o domain) tiene su CLAUDE.md, y el raíz lo enlaza
for (const area of fs.readdirSync(path.join(ROOT, 'src/features'))) {
  const dir = path.join(ROOT, 'src/features', area)
  const hasCode = ['use-cases', 'domain'].some((d) => fs.existsSync(path.join(dir, d)))
  if (!hasCode) continue
  const doc = `src/features/${area}/CLAUDE.md`
  if (!fs.existsSync(path.join(ROOT, doc))) fail(`falta ${doc}`)
  else if (!rootDoc.includes(doc)) fail(`CLAUDE.md raíz no enlaza ${doc}`)
}

if (errors.length) {
  console.error(`Guardas: ${errors.length} problema(s)\n` + errors.map((e) => `  ✖ ${e}`).join('\n'))
  process.exit(1)
}
console.log('Guardas: todo en orden')
