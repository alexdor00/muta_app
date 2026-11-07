// La lista de la compra: sale de las recetas de los días elegidos, con la ración de entreno o de descanso de cada día y
// las raciones de más de quien coma contigo. Regla del prototipo anterior (js/comida/dieta.js · shopCompute).
import { plainText } from '../../../shared/lib/format.ts'

/** Secciones de la lista y qué categorías de la base van en cada una (nombres sugeridos: el prototipo los ponía así). */
/**
 * Las secciones de la compra, en el orden de un paseo por el súper (sugerido). Cada una con las categorías de la base que
 * le tocan; lo que la base guarda junto pero se compra en otro pasillo (el caldo y las salsas van como verdura; los frutos
 * secos, como grasa) se reconoce por su nombre.
 */
export const SECCIONES: { id: string; nombre: string; categorias: string[] }[] = [
  { id: 'fruta', nombre: 'Fruta', categorias: ['Frutas'] },
  { id: 'verdura', nombre: 'Verdura y hortalizas', categorias: ['Verduras', 'Tubérculos'] },
  { id: 'carne', nombre: 'Carne', categorias: ['Carnes', 'Embutidos'] },
  { id: 'pescado', nombre: 'Pescado y marisco', categorias: ['Pescados'] },
  { id: 'lacteos', nombre: 'Huevos y lácteos', categorias: ['Huevos y lácteos'] },
  { id: 'pan', nombre: 'Pan, cereales y pasta', categorias: ['Cereales'] },
  { id: 'legumbres', nombre: 'Legumbres', categorias: ['Legumbres'] },
  { id: 'conservas', nombre: 'Conservas, salsas y caldos', categorias: [] },
  { id: 'aceites', nombre: 'Aceites y especias', categorias: ['Grasas'] },
  { id: 'frutos', nombre: 'Frutos secos y semillas', categorias: [] },
  { id: 'dulces', nombre: 'Dulces y picoteo', categorias: ['Dulces', 'Snacks'] },
  { id: 'bebidas', nombre: 'Bebidas', categorias: ['Bebidas'] },
  { id: 'platos', nombre: 'Platos preparados', categorias: ['Platos', 'Comida rápida'] },
  { id: 'suple', nombre: 'Suplementos', categorias: ['Suplementos'] },
  { id: 'despensa', nombre: 'Otros', categorias: [] },
]

/** Una palabra entera (con tildes: `\b` de JavaScript no las entiende). */
const palabra = (lista: string) => new RegExp(`(^|[^a-záéíóúüñ])(${lista})([^a-záéíóúüñ]|$)`)

const POR_NOMBRE: [RegExp, string][] = [
  [
    palabra(
      'caldo|salsas?|sofrito|tomate (frito|triturado|concentrado|natural)|pasta de tomate|ketchup|mostaza|mayonesa|vinagre|conservas?|en lata|encurtidos?',
    ),
    'conservas',
  ],
  [
    palabra(
      'almendras?|nuez|nueces|avellanas?|anacardos?|pistachos?|cacahuetes?|semillas?|sésamo|chía|lino|pipas|piñones|crema de (cacahuete|almendra)',
    ),
    'frutos',
  ],
  [
    palabra(
      'sal|pimienta|comino|pimentón|orégano|canela|curry|cúrcuma|especias?|chile en polvo|cayena|nuez moscada|laurel|tomillo|romero|ajo en polvo|cebolla en polvo',
    ),
    'aceites',
  ],
  [palabra('ajos?|cilantro|perejil|albahaca|menta|hierbabuena|cebollino|jengibre'), 'verdura'],
  [palabra('lima|limón|limones'), 'fruta'],
]

/** Sección de un producto por su categoría y, para lo que la base guarda junto, por su nombre (lo que no, a «Otros»). */
export function seccionDe(categoria: string, nombre = ''): string {
  const n = nombre.toLowerCase()
  const porNombre = POR_NOMBRE.find(([re]) => re.test(n))?.[1]
  return porNombre ?? SECCIONES.find((s) => s.categorias.includes(categoria))?.id ?? 'despensa'
}

export type Producto = {
  /** El alimento de la base o, si no hay, su nombre sin tildes. */
  clave: string
  nombre: string
  seccion: string
  /** Gramos en total; null si va sin cantidad («al gusto»). */
  gramos: number | null
  /** Las recetas en las que va. */
  usos: string[]
  /** Los menús de los que sale («Menú A»); vacío si sale de tu dieta. */
  menus: string[]
}

/** Lo que hay que comprar para estos días (con `extra[receta]` raciones de más). */
/** Lo que la lista necesita de una receta (una de tu dieta o un plato de tu menú). */
export type RecetaParaComprar = {
  id: string
  nombre: string
  /** El menú del que sale, si es de tus menús. */
  deMenu?: string
  lista: readonly { alimentoId: string | null; nombre: string; categoria: string; g: number | null }[]
}

export function listaDeLaCompra(
  dias: readonly { recetas: readonly RecetaParaComprar[] }[],
  extra: Readonly<Record<string, number>> = {},
): Producto[] {
  const productos = new Map<string, Producto>()
  for (const dia of dias)
    for (const r of dia.recetas) {
      const veces = 1 + (extra[r.id] ?? 0)
      for (const i of r.lista) {
        const clave = i.alimentoId ?? plainText(i.nombre)
        const p = productos.get(clave) ?? {
          clave,
          nombre: i.nombre.replace(/\s*\((en )?crud[oa]\)/i, ''),
          // Sin alimento de la base, su categoría no dice nada (el recetario les pone «Platos»): manda el nombre
          seccion: seccionDe(i.alimentoId ? i.categoria : '', i.nombre),
          gramos: null,
          usos: [],
          menus: [],
        }
        if (i.g !== null) p.gramos = (p.gramos ?? 0) + i.g * veces
        if (!p.usos.includes(r.nombre)) p.usos.push(r.nombre)
        if (r.deMenu && !p.menus.includes(r.deMenu)) p.menus.push(r.deMenu)
        productos.set(clave, p)
      }
    }
  return [...productos.values()]
    .map((p) => ({
      ...p,
      gramos: p.gramos === null ? null : Math.round(p.gramos),
      menus: [...p.menus].sort((a, b) => a.localeCompare(b, 'es')),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

/** La lista como texto, para Notas o WhatsApp: por secciones, con la cantidad y sin lo que ya tienes. */
export function textoDeLaCompra(
  productos: readonly Producto[],
  tienes: ReadonlySet<string>,
  propios: readonly { id: string; nombre: string; seccion: string }[],
  cantidad: (g: number) => string,
): string {
  const lineas: string[] = []
  for (const s of SECCIONES) {
    const de = [
      ...productos
        .filter((p) => p.seccion === s.id && !tienes.has(p.clave))
        .map((p) => `· ${p.nombre}${p.gramos ? `: ${cantidad(p.gramos)}` : ''}`),
      ...propios.filter((p) => p.seccion === s.id && !tienes.has(p.id)).map((p) => `· ${p.nombre}`),
    ]
    if (de.length) lineas.push(s.nombre.toUpperCase(), ...de, '')
  }
  return lineas.join('\n').trim()
}

/** Emoticonos por palabra del nombre (lo primero que encaja manda) y, si no, el de su sección. Solo decoran la lista. */
const EMOJI_NOMBRE: [string, string][] = [
  ['aguacate', '🥑'],
  ['manzana', '🍎'],
  ['plátano|platano|banana', '🍌'],
  ['naranja|mandarina', '🍊'],
  ['limón|limon|lima', '🍋'],
  ['fresa', '🍓'],
  ['arándano|arandano|frutos rojos|frambuesa|mora', '🫐'],
  ['uva', '🍇'],
  ['pera', '🍐'],
  ['piña', '🍍'],
  ['mango', '🥭'],
  ['melocotón|melocoton', '🍑'],
  ['kiwi', '🥝'],
  ['sandía|sandia|melón|melon', '🍉'],
  ['coco', '🥥'],
  ['cereza', '🍒'],
  ['tomate', '🍅'],
  ['zanahoria', '🥕'],
  ['brócoli|brocoli', '🥦'],
  ['lechuga|espinaca|rúcula|rucula|canónigo|kale|acelga', '🥬'],
  ['pepino|calabacín|calabacin', '🥒'],
  ['pimiento|chile|jalapeño|guindilla', '🫑'],
  ['cebolla|puerro|cebolleta', '🧅'],
  ['ajo', '🧄'],
  ['patata|boniato|batata', '🥔'],
  ['maíz|maiz', '🌽'],
  ['champiñón|champiñon|seta', '🍄'],
  ['berenjena', '🍆'],
  ['pollo|pavo', '🍗'],
  ['ternera|cerdo|lomo|carne|hamburguesa', '🥩'],
  ['jamón|jamon|bacon|beicon|chorizo|salchicha', '🥓'],
  ['gamba|langostino|marisco', '🦐'],
  ['salmón|salmon|atún|atun|merluza|bacalao|pescado|sardina|lubina|dorada', '🐟'],
  ['pulpo|calamar|sepia', '🦑'],
  ['huevo|clara', '🥚'],
  ['leche|kéfir|kefir', '🥛'],
  ['queso|requesón|requeson|mozzarella|parmesano', '🧀'],
  ['yogur|skyr', '🥣'],
  ['mantequilla', '🧈'],
  ['arroz', '🍚'],
  ['pasta|espagueti|macarr|fideo|tallarín|tallarin', '🍝'],
  ['pan|tostada|baguette|bagel|wrap|tortilla de trigo|tortita', '🍞'],
  ['avena|cereal|granola|copos', '🥣'],
  ['garbanzo|lenteja|alubia|judía|judia|soja|guisante', '🫘'],
  ['aceite', '🫒'],
  ['sal|pimienta|especia|comino|pimentón|pimenton|orégano|oregano|canela', '🧂'],
  ['almendra|nuez|nueces|cacahuete|anacardo|pistacho|avellana|semilla', '🥜'],
  ['chocolate|cacao', '🍫'],
  ['miel', '🍯'],
  ['café|cafe', '☕'],
  ['té |infusión|infusion', '🍵'],
  ['vino', '🍷'],
  ['agua', '💧'],
  ['caldo|sopa', '🍲'],
  ['salsa|ketchup|mostaza|mayonesa', '🥫'],
  ['proteína|proteina|whey', '💪'],
]
const EMOJI_SECCION: Record<string, string> = {
  fruta: '🍎',
  verdura: '🥬',
  carne: '🥩',
  pescado: '🐟',
  lacteos: '🥛',
  pan: '🍞',
  legumbres: '🫘',
  conservas: '🥫',
  aceites: '🫒',
  frutos: '🥜',
  dulces: '🍫',
  bebidas: '🥤',
  platos: '🍱',
  suple: '💪',
  despensa: '🛒',
}
const REGLAS_EMOJI = EMOJI_NOMBRE.map(([lista, e]) => [palabra(lista), e] as const)

/** El emoticono de un producto de la compra: por su nombre y, si no, por su sección. */
export function emojiDe(nombre: string, seccion: string): string {
  const n = nombre.toLowerCase()
  return REGLAS_EMOJI.find(([re]) => re.test(n))?.[1] ?? EMOJI_SECCION[seccion] ?? '🛒'
}
