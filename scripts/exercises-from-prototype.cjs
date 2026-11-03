// Saca la biblioteca de ejercicios del prototipo anterior (js/nucleo/conocimiento.js, constante EXERCISES) a
// src/shared/content/exercises.json, con los campos renombrados de docs/conocimiento/03-migracion.md.
// No se copia a mano: si el prototipo cambia, se vuelve a ejecutar.
// Uso: node scripts/exercises-from-prototype.cjs [ruta del prototipo] (por defecto ../prueba)
const fs = require('node:fs')
const path = require('node:path')

const prototype = process.argv[2] ?? path.join(__dirname, '..', '..', 'prueba')
const file = path.join(prototype, 'js', 'nucleo', 'conocimiento.js')
const line = fs
  .readFileSync(file, 'utf8')
  .split('\n')
  .find((l) => l.startsWith('const EXERCISES = '))
if (!line) throw new Error(`No está la constante EXERCISES en ${file}`)
const source = JSON.parse(line.replace('const EXERCISES = ', '').trim().replace(/;$/, ''))

const KIND = { C: 'compound', A: 'isolation' }
const EQUIPMENT = {
  Barra: 'barbell',
  Mancuerna: 'dumbbell',
  Máquina: 'machine',
  Polea: 'cable',
  'Peso corporal': 'bodyweight',
  Otro: 'other',
}
const GYMS = { gym: 'gym', basico: 'basic', casa: 'home' }

function known(map, value, field, id) {
  if (!(value in map)) throw new Error(`${id}: «${value}» no es un valor conocido de ${field}`)
  return map[value]
}

const exercises = source.map((e) => ({
  id: e.id,
  name: e.n,
  primary: e.g,
  contributes: e.c,
  kind: known(KIND, e.t, 'tipo', e.id),
  equipment: known(EQUIPMENT, e.m, 'material', e.id),
  pattern: e.p,
  gyms: e.eq.map((g) => known(GYMS, g, 'gimnasio', e.id)),
  reps: e.rep,
  rir: e.rir,
  restSec: e.rest,
  stepKg: e.inc,
  heavy: e.heavy,
  stable: e.stable,
  key: e.tip,
  source: e.ref,
}))

const out = path.join(__dirname, '..', 'src', 'shared', 'content', 'exercises.json')
fs.writeFileSync(out, `${JSON.stringify(exercises, null, 2)}\n`)
console.log(`${exercises.length} ejercicios → ${path.relative(process.cwd(), out)}`)
