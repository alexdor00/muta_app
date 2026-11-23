// Genera src/shared/content/foods-rapida.json: la comida rápida de cadenas (usuario, 2026-11-21: «todo tipo de guarrerías
// de cadenas, con los nombres reales»; opción 3: FatSecret España, marcado «aproximado»). Lee private/rapida/fatsecret.json
// (fuera de git: lo que se leyó de sus páginas) y no se edita a mano: se vuelve a generar con `node scripts/foods-rapida.cjs`.
// Cómo viene cada cifra en FatSecret:
// - «100 g» o «100 ml»: por 100 g.
// - «1 porción (N g)»: por esa ración, salvo Taco Bell, que da 100 g y el peso de la ración (sus patatas pequeñas y
//   medianas tienen las mismas kcal). Con el peso, se pasa a 100 g y se apunta en gramos o raciones.
// - «1 porción», «1 pizza» sin peso: por ración (`porRacion`): se apunta solo en raciones.
const fs = require('fs')
const path = require('path')

const ORIGEN = path.join(__dirname, '../private/rapida/fatsecret.json')
const DESTINO = path.join(__dirname, '../src/shared/content/foods-rapida.json')

const CADENAS = {
  mcdonalds: "McDonald's",
  'burger-king': 'Burger King',
  kfc: 'KFC',
  telepizza: 'Telepizza',
  'dominos-pizza': "Domino's Pizza",
  '100-montaditos': '100 Montaditos',
  'taco-bell': 'Taco Bell',
  'five-guys': 'Five Guys',
}
/** Las cadenas que dan 100 g con el peso de la ración entre paréntesis. */
const POR_100_CON_PESO = new Set(['taco-bell'])

/** Palabras con su forma de verdad (marcas y siglas). */
const FORMA = {
  mcflurry: 'McFlurry',
  mcnuggets: 'McNuggets',
  mcpollo: 'McPollo',
  mcextreme: 'McExtreme',
  mac: 'Mac',
  cbo: 'CBO',
  bbq: 'BBQ',
  whopper: 'Whopper',
  kitkat: 'KitKat',
  oreo: 'Oreo',
  nutella: 'Nutella',
  häagen: 'Häagen-Dazs',
  dazs: '',
  king: 'King',
  steakhouse: 'Steakhouse',
  cheeseburger: 'Cheeseburger',
  coronel: 'Coronel',
  emmental: 'Emmental',
  quesarito: 'Quesarito',
  supreme: 'Supreme',
  crispy: 'Crispy',
  chicken: 'Chicken',
  fusion: 'Fusion',
  pepperoni: 'Pepperoni',
  texas: 'Texas',
  extravaganzza: 'Extravaganzza',
  finizzima: 'Finizzima',
}
/** Lo que FatSecret corta en la dirección. */
const CORTADO = { cr: 'crujiente', cruji: 'crujiente', or: 'original' }

function nombreDe(slug) {
  const crudo = decodeURIComponent(slug.split('/')[0])
  const palabras = crudo
    .split('-')
    .map((p, i, todas) => (i === todas.length - 1 && CORTADO[p] ? CORTADO[p] : p))
    .map((p) => (p in FORMA ? FORMA[p] : p))
    .filter(Boolean)
  const texto = palabras.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const r1 = (n) => Math.round(n * 10) / 10
const id = (cadena, slug) =>
  `r_${cadena}_${decodeURIComponent(slug.split('/')[0])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()}`

const datos = JSON.parse(fs.readFileSync(ORIGEN, 'utf8'))
const salida = []
for (const [cadena, { productos }] of Object.entries(datos)) {
  const marca = CADENAS[cadena] ?? cadena
  // Sin repetidos: si una dirección cortada es el principio de otra, va la entera
  const slugs = productos.map((p) => decodeURIComponent(p.slug.split('/')[0]))
  for (const p of productos) {
    const s = decodeURIComponent(p.slug.split('/')[0])
    if (slugs.some((o) => o !== s && o.startsWith(s))) continue
    if (!(p.kcal > 0)) continue
    const peso = Number((p.racion.match(/\((\d+)\s*(g|ml)\)/) ?? [])[1]) || null
    const por100 = /^100\s*(g|ml)$/.test(p.racion.trim())
    const base = { id: id(cadena, p.slug), name: `${nombreDe(p.slug)} (${marca})`, category: 'Comida rápida' }
    const valores = (f) => ({
      kcal: Math.round(p.kcal * f),
      protein: r1(p.protein * f),
      carbs: r1(p.carbs * f),
      fat: r1(p.fat * f),
    })
    let alimento
    if (por100) alimento = { ...base, ...valores(1), servingG: 100, servingLabel: 'ración' }
    else if (peso && POR_100_CON_PESO.has(cadena))
      alimento = { ...base, ...valores(1), servingG: peso, servingLabel: 'ración' }
    else if (peso) alimento = { ...base, ...valores(100 / peso), servingG: peso, servingLabel: 'ración' }
    else
      alimento = {
        ...base,
        ...valores(1),
        servingG: 100,
        servingLabel: /pizza/.test(p.racion) ? 'pizza' : 'ración',
        porRacion: true,
      }
    salida.push({ ...alimento, aproximado: true })
  }
}
salida.sort((a, b) => a.name.localeCompare(b.name, 'es'))
fs.writeFileSync(DESTINO, `${JSON.stringify(salida, null, 2)}\n`)
console.log(`foods-rapida.json: ${salida.length} productos de ${Object.keys(datos).length} cadenas`)
