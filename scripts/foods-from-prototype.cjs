// Saca la base de alimentos del prototipo anterior (js/nucleo/conocimiento.js: FOOD_ROWS y los bloques foodsAdd, por 100 g,
// valores medios BEDCA y USDA) a src/shared/content/foods.json, con los campos de docs/conocimiento/01-contenido.md (sección 10).
// No se copia a mano: si el prototipo cambia, se vuelve a ejecutar.
// Uso: node scripts/foods-from-prototype.cjs [ruta del prototipo] (por defecto ../prueba)
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const prototype = process.argv[2] ?? path.join(__dirname, '..', '..', 'prueba')
const file = path.join(prototype, 'js', 'nucleo', 'conocimiento.js')
const lines = fs.readFileSync(file, 'utf8').split('\n')
const start = lines.findIndex((l) => l.startsWith('const FOOD_ROWS'))
const end = lines.findIndex((l, i) => i > start && l.startsWith('// Une la base ampliada'))
if (start < 0 || end < 0) throw new Error(`No están FOOD_ROWS o la unión de la base ampliada en ${file}`)
// El bloque que une las dos tablas va entre llaves justo después del comentario
const close = lines.findIndex((l, i) => i > end && l === '}')
const code = `${lines.slice(start, close + 1).join('\n')}\nresult = FOODS;`
const context = { result: null }
vm.runInNewContext(code.replace(/^const /gm, 'var '), context)

const foods = context.result.map((f) => ({
  id: f.id,
  name: f.n,
  category: f.cat,
  kcal: f.kcal,
  protein: f.p,
  carbs: f.c,
  fat: f.f,
  servingG: f.g,
  servingLabel: f.unit,
}))

const out = path.join(__dirname, '..', 'src', 'shared', 'content', 'foods.json')
fs.writeFileSync(out, `${JSON.stringify(foods, null, 2)}\n`)
const categories = [...new Set(foods.map((f) => f.category))]
console.log(
  `${foods.length} alimentos en ${categories.length} categorías → ${path.relative(process.cwd(), out)}`,
)
