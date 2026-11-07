// Los platos que puedes comer: los del recetario (private/recetas, con las cifras del libro), los de ejemplo del prototipo
// (si no hay recetario) y los tuyos. Un plato no es una receta de tu dieta (diet.ts): no tiene versión de entreno y de
// descanso; sus gramos los ajusta fit.ts a lo que te falta.
import { plainText } from '../../../shared/lib/format.ts'
import type { Receta } from './diet.ts'
import type { Alimento, ComidaId, Macros } from './food.ts'

export type MacroId = 'protein' | 'carbs' | 'fat'

export const MACROS: { id: MacroId; nombre: string; corto: string; kcalPorG: number }[] = [
  { id: 'protein', nombre: 'Proteína', corto: 'P', kcalPorG: 4 },
  { id: 'carbs', nombre: 'Hidratos', corto: 'HC', kcalPorG: 4 },
  { id: 'fat', nombre: 'Grasa', corto: 'G', kcalPorG: 9 },
]

/** Un ingrediente de un plato: lo que dice el libro (`texto`) y, si se ha casado con la base, sus valores por 100 g. */
export type IngredientePlato = {
  texto: string
  nombre: string
  /** Categoría de la base (sección de la compra). */
  categoria: string
  por100: Macros | null
  alimentoId: string | null
  /** false: especias, «al gusto», decoración (no suma ni se compra con cantidad). */
  cuenta: boolean
  /** Gramos en el plato entero; null si no se sabe. */
  gramos: number | null
  /** Los gramos salen de unidades («1 kiwi», «1 cda»): son sugeridos. */
  sugerido: boolean
  /** Su macro principal si se puede mover al ajustar; null si no se toca. */
  macro: MacroId | null
  /** Si lo cambiaste: el nombre que traía el plato. */
  antes?: string
}

export type Plato = {
  id: string
  /** Su número en el recetario (para la foto); null en los demás. */
  numero: number | null
  nombre: string
  categoria: string
  dificultad: string
  minutos: number | null
  /** Raciones del plato entero (casi siempre 1; la granola, 10). */
  raciones: number
  /** Lo del plato entero: el del libro en el recetario; la suma de sus ingredientes en los demás. */
  total: Macros
  ingredientes: IngredientePlato[]
  pasos: string[]
  /** Tiene algo que mover (y es de una ración). */
  ajustable: boolean
  origen: 'recetario' | 'ejemplo' | 'tuyo'
}

export type CategoriaPlato = { id: string; nombre: string }

export type Recetario = { rev: number; categorias: CategoriaPlato[]; platos: Plato[] }

const esMacros = (x: unknown): x is Macros =>
  typeof x === 'object' &&
  x !== null &&
  ['kcal', 'protein', 'carbs', 'fat'].every((k) => typeof (x as Record<string, unknown>)[k] === 'number')

/** Lee el recetario del archivo; null si no tiene la forma esperada. Los platos que no la tienen se quedan fuera. */
export function leerRecetario(x: unknown): Recetario | null {
  if (typeof x !== 'object' || x === null) return null
  const o = x as { rev?: unknown; categorias?: unknown; recetas?: unknown }
  if (!Array.isArray(o.categorias) || !Array.isArray(o.recetas)) return null
  const platos = (o.recetas as Record<string, unknown>[])
    .filter(
      (r) =>
        typeof r.id === 'string' &&
        typeof r.nombre === 'string' &&
        esMacros(r.total) &&
        Array.isArray(r.ingredientes) &&
        Array.isArray(r.pasos),
    )
    .map((r): Plato => {
      const ingredientes = (r.ingredientes as IngredientePlato[]).map((i) => {
        const por100 = esMacros(i.por100) ? i.por100 : null
        // El macro se vuelve a sacar aquí (no del archivo): así cambia la regla sin rehacer el recetario
        const macro = por100 && typeof i.gramos === 'number' ? macroDe(por100, i.gramos, i.categoria) : null
        return { ...i, por100, macro: i.macro === null ? null : macro }
      })
      return {
        id: r.id as string,
        numero: typeof r.numero === 'number' ? r.numero : null,
        nombre: r.nombre as string,
        categoria: String(r.categoria ?? ''),
        dificultad: String(r.dificultad ?? ''),
        minutos: typeof r.minutos === 'number' ? r.minutos : null,
        raciones: typeof r.raciones === 'number' && r.raciones > 0 ? r.raciones : 1,
        total: r.total as Macros,
        ingredientes,
        pasos: (r.pasos as unknown[]).map(String),
        ajustable: r.ajustable === true && ingredientes.some((i) => i.macro),
        origen: 'recetario',
      }
    })
  return {
    rev: typeof o.rev === 'number' ? o.rev : 0,
    categorias: (o.categorias as CategoriaPlato[]).filter((c) => typeof c.id === 'string'),
    platos,
  }
}

/**
 * Lo que no se mueve al ajustar aunque aporte (sugerido): las verduras, las salsas y los caldos (la base guarda las
 * salsas y el caldo como verdura) y las bebidas. Subir la cebolla o el tomate para llegar a los hidratos no es cocinar;
 * se mueve lo principal: carne, pescado, huevos y lácteos, cereales, legumbres, tubérculos, fruta y grasas.
 */
export const NO_SE_AJUSTA = ['Verduras', 'Bebidas'] as const

/**
 * El macro que manda en un ingrediente (si aporta al menos 40 kcal y no es de lo que no se ajusta): la proteína si da un
 * 30 % de sus kcal.
 */
export function macroDe(por100: Macros, gramos: number, categoria = ''): MacroId | null {
  if ((NO_SE_AJUSTA as readonly string[]).includes(categoria)) return null
  if ((por100.kcal * gramos) / 100 < 40) return null
  const k = { protein: por100.protein * 4, carbs: por100.carbs * 4, fat: por100.fat * 9 }
  if (k.protein >= 0.3 * por100.kcal) return 'protein'
  return k.carbs >= k.fat ? 'carbs' : 'fat'
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** La suma de unos ingredientes (los que cuentan y tienen gramos). */
export function sumaDe(ingredientes: readonly IngredientePlato[]): Macros {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  for (const i of ingredientes) {
    if (!i.cuenta || !i.por100 || i.gramos === null) continue
    const k = i.gramos / 100
    t.kcal += i.por100.kcal * k
    t.protein += i.por100.protein * k
    t.carbs += i.por100.carbs * k
    t.fat += i.por100.fat * k
  }
  return { kcal: Math.round(t.kcal), protein: r1(t.protein), carbs: r1(t.carbs), fat: r1(t.fat) }
}

/** Un ingrediente de la base con sus gramos. */
export function ingredienteDe(a: Alimento, gramos: number, texto = ''): IngredientePlato {
  const por100 = { kcal: a.kcal, protein: a.protein, carbs: a.carbs, fat: a.fat }
  return {
    texto: texto || `${gramos} g de ${a.name.toLowerCase()}`,
    nombre: a.name,
    categoria: a.category,
    por100,
    alimentoId: a.id,
    cuenta: true,
    gramos,
    sugerido: false,
    macro: macroDe(por100, gramos, a.category),
  }
}

/** Un plato tuyo: su total es la suma de sus ingredientes. */
export function platoTuyo(
  id: string,
  nombre: string,
  ingredientes: IngredientePlato[],
  pasos: string[] = [],
): Plato {
  return {
    id,
    numero: null,
    nombre,
    categoria: 'tuyos',
    dificultad: '',
    minutos: null,
    raciones: 1,
    total: sumaDe(ingredientes),
    ingredientes,
    pasos,
    ajustable: ingredientes.some((i) => i.macro),
    origen: 'tuyo',
  }
}

/** Una receta de la dieta de ejemplo como plato (con los gramos del día de entreno). */
export function platoDeReceta(r: Receta): Plato {
  const ingredientes = r.ingredientes.map((i): IngredientePlato => ({
    texto: i.gramos ? `${i.gramos.entreno} g de ${i.nombre.toLowerCase()}` : `${i.nombre} ${i.nota}`.trim(),
    nombre: i.nombre,
    categoria: i.categoria,
    por100: i.por100,
    alimentoId: i.alimentoId,
    cuenta: i.gramos !== null,
    gramos: i.gramos?.entreno ?? null,
    sugerido: false,
    macro: i.gramos ? macroDe(i.por100, i.gramos.entreno, i.categoria) : null,
  }))
  return {
    ...platoTuyo(`ej-${r.id}`, r.nombre, ingredientes, r.pasos),
    categoria: 'ejemplo',
    origen: 'ejemplo',
  }
}

/** Busca por nombre del plato o de sus ingredientes (sin tildes; todas las palabras). */
export function buscarPlatos(platos: readonly Plato[], texto: string): Plato[] {
  const palabras = plainText(texto).split(/\s+/).filter(Boolean)
  if (!palabras.length) return [...platos]
  return platos.filter((p) => {
    const en = plainText(`${p.nombre} ${p.ingredientes.map((i) => i.nombre).join(' ')}`)
    return palabras.every((w) => en.includes(w))
  })
}

/** Qué categorías del recetario van con cada comida (sugerido: el libro no lo dice). */
export const CATEGORIAS_DE_COMIDA: Record<ComidaId, string[]> = {
  desayuno: ['batidos', 'panes', 'postres'],
  comida: ['sopas', 'pescado', 'carne'],
  merienda: ['batidos', 'panes', 'postres'],
  cena: ['sopas', 'pescado', 'carne'],
}

/** Si un plato va con una comida (los de ejemplo y los tuyos, con todas). */
export function vaCon(p: Plato, comida: ComidaId): boolean {
  return p.origen !== 'recetario' || CATEGORIAS_DE_COMIDA[comida].includes(p.categoria)
}

/** Un ingrediente cambiado: por tu marca (mismos gramos) o por otro alimento (sus gramos); `fecha`, solo ese día. */
export type CambioIngrediente = { alimentoId: string; gramos: number | null; fecha?: string }

/** Tus cambios: tu marca en todos tus platos (genérico → el tuyo) o un ingrediente de un plato (manda sobre lo otro). */
export type Productos = {
  id: 'productos'
  target: 'nutricion'
  siempre: Record<string, string>
  /** Plato → ingrediente (su posición) → el cambio. */
  enPlato: Record<string, Record<string, CambioIngrediente>>
}

export const productosVacios = (): Productos => ({
  id: 'productos',
  target: 'nutricion',
  siempre: {},
  enPlato: {},
})

/** El cambio de un ingrediente de un plato un día (null: como en el plato). */
/** La clave de un cambio de un solo día («3@2026-11-07»); el de siempre va con el índice solo («3»). */
export const claveDelDia = (k: number, fecha: string) => `${k}@${fecha}`

export function cambioEn(
  productos: Productos | null,
  plato: Plato,
  k: number,
  fecha: string,
): CambioIngrediente | null {
  if (!productos) return null
  const delDia = productos.enPlato[plato.id]?.[claveDelDia(k, fecha)]
  if (delDia) return delDia
  const propio = productos.enPlato[plato.id]?.[String(k)]
  if (propio && (!propio.fecha || propio.fecha === fecha)) return propio
  const generico = plato.ingredientes[k]?.alimentoId
  const tuyo = generico ? productos.siempre[generico] : undefined
  return tuyo ? { alimentoId: tuyo, gramos: null } : null
}

/** Lo que hace falta de un alimento para cambiar un ingrediente. */
export type AlimentoBase = Pick<Alimento, 'id' | 'name' | 'category' | 'kcal' | 'protein' | 'carbs' | 'fat'>

/**
 * El plato con tus cambios de ese día: cada ingrediente cambiado lleva su alimento y sus gramos, y el total del plato (el
 * del libro) suma la diferencia. `antes` guarda el nombre que traía.
 */
export function platoCon(
  p: Plato,
  productos: Productos | null,
  alimentoDe: (id: string) => AlimentoBase | null,
  fecha: string,
): Plato {
  if (!productos) return p
  let total = { ...p.total }
  let cambia = false
  const ingredientes = p.ingredientes.map((i, k) => {
    const c = cambioEn(productos, p, k, fecha)
    const a = c ? alimentoDe(c.alimentoId) : null
    if (!c || !a || !i.cuenta || !i.por100 || i.gramos === null) return i
    cambia = true
    const g = c.gramos ?? i.gramos
    const v = { kcal: a.kcal, protein: a.protein, carbs: a.carbs, fat: a.fat }
    total = {
      kcal: total.kcal + (g * v.kcal - i.gramos * i.por100.kcal) / 100,
      protein: total.protein + (g * v.protein - i.gramos * i.por100.protein) / 100,
      carbs: total.carbs + (g * v.carbs - i.gramos * i.por100.carbs) / 100,
      fat: total.fat + (g * v.fat - i.gramos * i.por100.fat) / 100,
    }
    return {
      ...i,
      nombre: a.name,
      categoria: a.category,
      alimentoId: a.id,
      por100: v,
      gramos: g,
      sugerido: c.gramos === null && i.sugerido,
      macro: macroDe(v, g, a.category),
      antes: i.nombre,
    }
  })
  return cambia ? { ...p, total, ingredientes } : p
}

/** Tu versión de un plato: con sus gramos, sin lo que quitas y con lo que añades (el total sigue partiendo del suyo). */
export function platoEditado(
  p: Plato,
  cambios: {
    id: string
    nombre: string
    gramos: readonly (number | null)[]
    quitar: readonly number[]
    anadir: readonly IngredientePlato[]
    pasos: string[]
  },
): Plato {
  const ingredientes = p.ingredientes.map((i, k) => ({ ...i, gramos: cambios.gramos[k] ?? i.gramos }))
  const quedan = ingredientes.filter((_, k) => !cambios.quitar.includes(k))
  const total = { ...p.total }
  const suma = (i: IngredientePlato, signo: 1 | -1, g: number | null) => {
    if (!i.cuenta || !i.por100 || g === null) return
    for (const m of ['kcal', 'protein', 'carbs', 'fat'] as const) total[m] += (signo * i.por100[m] * g) / 100
  }
  p.ingredientes.forEach((i, k) => {
    suma(i, -1, i.gramos)
    if (!cambios.quitar.includes(k)) suma(i, 1, ingredientes[k].gramos)
  })
  for (const i of cambios.anadir) suma(i, 1, i.gramos)
  const todos = [...quedan, ...cambios.anadir].map((i) =>
    i.por100 && i.gramos !== null ? { ...i, macro: macroDe(i.por100, i.gramos, i.categoria) } : i,
  )
  return {
    ...p,
    id: cambios.id,
    numero: p.numero,
    nombre: cambios.nombre.trim() || p.nombre,
    ingredientes: todos,
    pasos: cambios.pasos,
    total: {
      kcal: Math.max(0, Math.round(total.kcal)),
      protein: Math.max(0, r1(total.protein)),
      carbs: Math.max(0, r1(total.carbs)),
      fat: Math.max(0, r1(total.fat)),
    },
    ajustable: p.raciones === 1 && todos.some((i) => i.macro),
    origen: 'tuyo',
    categoria: p.origen === 'tuyo' ? p.categoria : 'tuyos',
  }
}
