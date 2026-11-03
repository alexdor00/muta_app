// Saca los consejos de la sesión del prototipo anterior a src/shared/content/tips/ (no se copian a mano):
// - pre.json: la lista «Antes de la primera serie» (js/entreno/consejos.js, YG.pre).
// - muscles.json: la clave, los consejos y el reparto de cada músculo (js/entreno/consejos.js, YG.muscle y YG.where).
// - session.json: los textos de las reglas «Para esta sesión» (js/entreno/consejos-pantalla.js, ygSessionRecs), cada
//   uno con su id; las reglas en sí están en src/features/training/domain/sessionTips.ts.
// Uso: node scripts/tips-from-prototype.cjs [ruta del prototipo] (por defecto ../prueba)
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const prototype = process.argv[2] ?? path.join(__dirname, '..', '..', 'prueba')
const out = path.join(__dirname, '..', 'src', 'shared', 'content', 'tips')

// pre: se ejecuta consejos.js aparte y se lee YG.pre tal cual
const consejos = fs.readFileSync(path.join(prototype, 'js', 'entreno', 'consejos.js'), 'utf8')
const ctx = {}
vm.runInNewContext(`${consejos}\n;globalThis.__yg = YG`, ctx)
const tip = (t) => ({ text: t.t, why: t.w, source: t.s })
const pre = ctx.__yg.pre.map(tip)
if (pre.length !== 9) throw new Error(`Se esperaban 9 consejos de antes de empezar y hay ${pre.length}`)

// session: cada add(ok, texto, porqué, fuente) de ygSessionRecs, en su orden, con el id de su regla
const pantalla = fs.readFileSync(path.join(prototype, 'js', 'entreno', 'consejos-pantalla.js'), 'utf8')
const cuerpo = pantalla.slice(
  pantalla.indexOf('function ygSessionRecs'),
  pantalla.indexOf('function ygCoverage'),
)
const IDS = [
  'lateralEmpuje',
  'lateralTiron',
  'lateralPorDetras',
  'bicepsEnEmpuje',
  'bicepsFaltaEnEmpuje',
  'tricepsEnTiron',
  'tricepsFaltaEnTiron',
  'bicepsEnTiron',
  'prioridadTarde',
  'gemelo',
  'coreConCarga',
  'coreEstabilidad',
  'antebrazoEnTiron',
  'antebrazoSinTiron',
  'curlFemoralYBisagra',
  'hackYPrensa',
]
const ADD = /add\((true|false|[^,]+?),\s*(['`])((?:\\.|(?!\2).)*)\2,\s*'((?:\\.|[^'])*)',\s*'([^']*)'\)/g
const textos = [...cuerpo.matchAll(ADD)].map((m) => ({
  ok: m[1] === 'true',
  // Plantillas del prototipo → huecos con nombre: «{musculo} es tu prioridad y va en el puesto {puesto}…»
  text: m[3].replace('${MUSCLE[e.g].n}', '{musculo}').replace('${i + 1}', '{puesto}'),
  why: m[4],
  source: m[5],
}))
if (textos.length !== IDS.length) throw new Error(`Se esperaban ${IDS.length} reglas y hay ${textos.length}`)
if (textos.some((t) => t.text.includes('${'))) throw new Error('Queda una plantilla sin traducir')
const session = Object.fromEntries(IDS.map((id, i) => [id, textos[i]]))

// muscles: la clave, los consejos y dónde ponerlo en la rutina de cada músculo (YG.muscle y YG.where)
const muscles = Object.fromEntries(
  Object.entries(ctx.__yg.muscle).map(([id, m]) => [
    id,
    { key: m.clave, tips: m.tips.map(tip), where: ctx.__yg.where[id] ?? null },
  ]),
)
const total = Object.values(muscles).reduce((n, m) => n + m.tips.length, 0)
if (total !== 137) throw new Error(`Se esperaban 137 consejos de músculos y hay ${total}`)

fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'muscles.json'), `${JSON.stringify(muscles, null, 2)}\n`)
fs.writeFileSync(path.join(out, 'pre.json'), `${JSON.stringify(pre, null, 2)}\n`)
fs.writeFileSync(path.join(out, 'session.json'), `${JSON.stringify(session, null, 2)}\n`)
console.log(
  `${pre.length} de antes de empezar y ${textos.length} reglas de la sesión → ${path.relative(process.cwd(), out)}`,
)
