// Productos de supermercados españoles de Open Food Facts (ODbL: datos abiertos, citando la fuente) para buscar en la
// app sin internet y reconocer su código de barras. Sale src/shared/content/foods-super.json:
// [código, nombre, marca, categoría, kcal, proteína, hidratos, grasa] por 100 g. Uso: node scripts/foods-off.mjs
/* global console, fetch, setTimeout */
import fs from 'node:fs'

const MARCAS = {
  Mercadona: ['hacendado', 'deliplus', 'bosque-verde'],
  Lidl: [
    'milbona',
    'pikok',
    'solevita',
    'crownfield',
    'combino',
    'freeway',
    'vitasia',
    'chef-select',
    'lidl',
    'deluxe',
  ],
  Carrefour: ['carrefour', 'carrefour-bio', 'carrefour-classic', 'carrefour-el-mercado'],
  Alcampo: ['auchan', 'alcampo'],
  Ahorramás: ['alipende'],
  Dia: ['dia', 'dia-nature'],
  Eroski: ['eroski'],
}
const POR_MARCA = 4000
const URL = 'https://search.openfoodfacts.org/search'

// Categoría de la base (para la compra y los intercambios) a partir de las de Open Food Facts
const CATEGORIAS = [
  [/meat|poultry|chicken|ham|sausage|pork|beef/, 'Carnes'],
  [/fish|seafood|tuna|salmon/, 'Pescados'],
  [/dair|milk|yogurt|cheese|egg/, 'Huevos y lácteos'],
  [/bread|cereal|pasta|rice|flour|breakfast/, 'Cereales'],
  [/legume|bean|lentil|chickpea/, 'Legumbres'],
  [/fruit/, 'Frutas'],
  [/vegetable|salad/, 'Verduras'],
  [/potato/, 'Tubérculos'],
  [/oil|butter|fat/, 'Grasas'],
  [/beverage|drink|juice|water|coffee|tea/, 'Bebidas'],
  [/snack|chocolate|biscuit|candy|sweet|dessert|confection/, 'Dulces'],
  [/supplement|protein-powder|whey/, 'Suplementos'],
]
const categoria = (tags = []) => {
  const t = tags.join(' ')
  return CATEGORIAS.find(([re]) => re.test(t))?.[1] ?? 'Platos'
}
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? Math.round(x * 10) / 10 : null)
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms))

const salida = new Map()
for (const [super_, marcas] of Object.entries(MARCAS))
  for (const marca of marcas) {
    let n = 0
    for (let pagina = 1; n < POR_MARCA; pagina++) {
      const q = `brands_tags:"${marca}" AND countries_tags:"en:spain"`
      const url = `${URL}?q=${encodeURIComponent(q)}&page=${pagina}&page_size=100&fields=code,product_name_es,product_name,brands,nutriments,categories_tags`
      let r
      for (let intento = 0; intento < 3; intento++) {
        try {
          r = await (await fetch(url, { headers: { 'User-Agent': 'MUTA/0.1 (app personal)' } })).json()
          break
        } catch {
          await espera(2000)
        }
      }
      const hits = r?.hits ?? []
      for (const h of hits) {
        const m = h.nutriments ?? {}
        const fila = [
          String(h.code ?? ''),
          String(h.product_name_es || h.product_name || '').trim(),
          (Array.isArray(h.brands) ? h.brands[0] : String(h.brands ?? '')).trim(),
          categoria(h.categories_tags),
          num(m['energy-kcal_100g']),
          num(m.proteins_100g),
          num(m.carbohydrates_100g),
          num(m.fat_100g),
        ]
        if (!/^\d{8,14}$/.test(fila[0]) || !fila[1] || fila.slice(4).some((x) => x === null)) continue
        if (fila[4] > 950 || fila[5] + fila[6] + fila[7] > 105) continue
        salida.set(fila[0], fila)
        n++
      }
      if (hits.length < 100) break
      await espera(250)
    }
    console.log(super_, marca, n)
  }

const lista = [...salida.values()].sort((a, b) => a[1].localeCompare(b[1], 'es'))
fs.writeFileSync('src/shared/content/foods-super.json', JSON.stringify(lista))
console.log('total', lista.length)
