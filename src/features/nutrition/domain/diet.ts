// Tu dieta: menús que se repiten en un ciclo (de los días que diga la dieta: 7, 6, 4…), recetas con su versión de entreno y de descanso, y lo que la
// consulta semanal cambia (kcal por tipo de día, pasos y fase). Reglas del prototipo anterior (js/comida/dieta.js):
// qué día del menú es hoy, qué receta absorbe los cambios de kcal y cómo se redondean sus gramos.
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import { sumar, type ComidaId, type Macros } from './food.ts'

export type TipoDia = 'entreno' | 'descanso'

export const TIPOS_DIA: { id: TipoDia; nombre: string }[] = [
  { id: 'entreno', nombre: 'Día de entreno' },
  { id: 'descanso', nombre: 'Día de descanso' },
]

/** Un ingrediente de una receta, con sus valores por 100 g (los de la base al crearla, o los del archivo). */
export type Ingrediente = {
  nombre: string
  alimentoId: string | null
  /** Sección de la compra: la categoría de la base («Carnes», «Verduras»…). */
  categoria: string
  por100: Macros
  /** Gramos el día de entreno y el de descanso; null si va sin cantidad («sal al gusto»). */
  gramos: Record<TipoDia, number> | null
  /** Lo que se mueve cuando la consulta cambia las kcal (los hidratos de la receta). */
  ajusta: boolean
  /** Cómo va si no lleva gramos: «al gusto», «1 cucharadita». */
  nota: string
  /** Se hace el mismo día aunque el plato se cocine antes (el pescado, la verdura fresca). */
  alMomento?: boolean
}

export type Receta = {
  id: string
  nombre: string
  /** En qué comida del día se apunta. */
  comida: ComidaId
  /** Su nombre en el menú: «Comida 1», «Batido». */
  rotulo: string
  /** El menú al que pertenece; null si va todos los días. */
  menu: string | null
  soloEntreno: boolean
  /** Solo los días de descanso (lo contrario del preentreno). */
  soloDescanso?: boolean
  /** Cómo lo dice la dieta: con antelación (el día de cocinar) o al momento. */
  preparar?: 'antes' | 'momento'
  ingredientes: Ingrediente[]
  pasos: string[]
  notas: string[]
  /** Creada por ti (si no, venía en la dieta). */
  propia: boolean
}

export type Menu = { id: string; nombre: string }

/** Una fase de la dieta: desde qué semana y cuántas kcal suma al día. */
export type FaseDieta = { id: string; nombre: string; desdeSemana: number; kcal: number }

export const FORMATO = 'muta-dieta'

export type Dieta = {
  formato: typeof FORMATO
  version: 1
  id: string
  nombre: string
  descripcion: string
  menus: Menu[]
  /** El menú de cada día del ciclo (los días que dure, de 1 en adelante; el primero es el día 1). */
  ciclo: string[]
  /** Los días del ciclo en que se cocina (como «Cuándo cocinar» de la dieta); sin decir, los elige tu semana. */
  cocinar?: number[]
  recetas: Receta[]
  fases: FaseDieta[]
  /** Kilos por semana que la consulta considera bajar deprisa o despacio. */
  umbrales: { rapido: number; lento: number }
  /** La de ejemplo del prototipo (para probar). */
  ejemplo: boolean
}

/** Lo que la consulta cambia, desde un día: kcal por tipo de día, pasos y fase. */
export type AjusteDieta = {
  id: string
  desde: string
  kcal: Record<TipoDia, number>
  pasos: number
  fase: string | null
}

/** La dieta que sigues: desde cuándo (el día 1 del menú), lo que se ha cambiado y lo que eliges día a día. */
export type DietaActiva = {
  id: 'dieta'
  target: 'nutricion'
  dieta: Dieta
  inicio: string
  /** De más antiguo a más nuevo; vale el último con `desde` hasta la fecha. */
  ajustes: AjusteDieta[]
  /** Los días que cambiaste a mano: entreno o descanso. */
  tipoElegido: Record<string, TipoDia>
  /** Cuánto pesa tu arroz cocido por cada gramo en crudo (lo aprende Cocina). */
  factorArroz: number
  /** Las recetas de la dieta tal como venían, antes de editarlas (para volver a ellas). */
  originales: Record<string, Receta>
}

/** Lo más largo que puede durar el ciclo de una dieta (dos meses). */
export const MAX_CICLO = 60

/** Pasos al día de la regla (docs/conocimiento/02-reglas.md · sección 8). */
export const PASOS = 10_000
/** Umbrales de la regla: más de 0,9 kg por semana es deprisa; menos de 0,3, despacio. */
export const UMBRALES = { rapido: 0.9, lento: 0.3 }
/** Factor del arroz cocido del prototipo (100 g en crudo ≈ 300 g cocido) hasta que lo midas. */
export const FACTOR_ARROZ = 3

/** Día del ciclo de `n` días (1 = el día de inicio; de serie, 7). */
export function diaDelCiclo(inicio: string, fecha: string, n = 7): number {
  const largo = Math.max(1, n)
  return (((daysBetween(inicio, fecha) % largo) + largo) % largo) + 1
}

/** Semana de la dieta (1 = la primera). */
export function semanaDeDieta(inicio: string, fecha: string): number {
  return Math.floor(daysBetween(inicio, fecha) / 7) + 1
}

/** El día en que empieza la dieta si hoy es el día `n` del menú. */
export function inicioSi(hoy: string, n: number): string {
  return addDays(hoy, -(n - 1))
}

export function menuDe(dieta: Dieta, inicio: string, fecha: string): Menu {
  const id = dieta.ciclo[diaDelCiclo(inicio, fecha, dieta.ciclo.length) - 1]
  return dieta.menus.find((m) => m.id === id) ?? dieta.menus[0]
}

/** El ajuste que vale un día (el último con `desde` hasta esa fecha). */
export function ajusteDe(activa: Pick<DietaActiva, 'ajustes'>, fecha: string): AjusteDieta {
  const vale = activa.ajustes.filter((a) => a.desde <= fecha).at(-1)
  return vale ?? { id: '', desde: '', kcal: { entreno: 0, descanso: 0 }, pasos: PASOS, fase: null }
}

/** La fase que vale un día (la elegida o, si no hay, la primera). */
export function faseDe(dieta: Dieta, ajuste: AjusteDieta): FaseDieta | null {
  return dieta.fases.find((f) => f.id === ajuste.fase) ?? dieta.fases[0] ?? null
}

/** Kcal que suma la consulta (y la fase) a la receta que ajusta. */
export function kcalExtra(dieta: Dieta, ajuste: AjusteDieta, tipo: TipoDia): number {
  return (faseDe(dieta, ajuste)?.kcal ?? 0) + ajuste.kcal[tipo]
}

export const ORDEN: ComidaId[] = ['desayuno', 'comida', 'merienda', 'cena']

/** Las recetas de un día: las del menú y las de todos los días (el preentreno, solo si entrenas), por comidas. */
export function recetasDe(dieta: Dieta, menuId: string, tipo: TipoDia): Receta[] {
  return dieta.recetas
    .filter(
      (r) =>
        (r.menu === menuId || r.menu === null) &&
        (!r.soloEntreno || tipo === 'entreno') &&
        (!r.soloDescanso || tipo === 'descanso'),
    )
    .map((r, i) => [ORDEN.indexOf(r.comida) * 100 + i, r] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, r]) => r)
}

/** La receta del menú que absorbe los cambios de kcal: la primera con un ingrediente que ajusta (como en el prototipo). */
export function recetaQueAjusta(dieta: Dieta, menuId: string): Receta | null {
  return (
    dieta.recetas.find((r) => r.menu === menuId && r.ingredientes.some((i) => i.ajusta && i.gramos)) ?? null
  )
}

/** Un ingrediente como se come ese día: sus gramos (con el cambio de kcal si le toca) y sus macros. */
export type IngredienteDelDia = Ingrediente & { g: number | null; macros: Macros; cambia: boolean }

export type RecetaDelDia = Receta & { tipo: TipoDia; lista: IngredienteDelDia[]; total: Macros }

const r1 = (n: number) => Math.round(n * 10) / 10
const de5 = (n: number) => Math.round(n / 5) * 5

function macrosPor(por100: Macros, g: number): Macros {
  const k = g / 100
  return {
    kcal: Math.round(por100.kcal * k),
    protein: r1(por100.protein * k),
    carbs: r1(por100.carbs * k),
    fat: r1(por100.fat * k),
  }
}

/**
 * La receta de un tipo de día. `extra` son las kcal que suma o resta la consulta: van al primer ingrediente que ajusta,
 * en gramos de 5 en 5 (nunca menos de 0).
 */
export function recetaDelDia(receta: Receta, tipo: TipoDia, extra = 0, raciones = 1): RecetaDelDia {
  let pendiente = extra
  const lista = receta.ingredientes.map((i): IngredienteDelDia => {
    if (!i.gramos) return { ...i, g: null, macros: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, cambia: false }
    let g = i.gramos[tipo]
    if (pendiente && i.ajusta && i.por100.kcal > 0) {
      g = Math.max(0, de5(g + (pendiente * 100) / i.por100.kcal))
      pendiente = 0
    }
    const base = i.gramos.entreno
    g *= raciones
    return { ...i, g, macros: macrosPor(i.por100, g), cambia: g !== base * raciones }
  })
  return { ...receta, tipo, lista, total: sumar(lista.map((x) => x.macros)) }
}

/** Lo que toca comer un día con tu dieta. */
export type DiaDeDieta = {
  fecha: string
  tipo: TipoDia
  menu: Menu
  diaCiclo: number
  semana: number
  recetas: RecetaDelDia[]
  total: Macros
  pasos: number
}

export function diaDeDieta(activa: DietaActiva, fecha: string, tipo: TipoDia): DiaDeDieta {
  const { dieta } = activa
  const menu = menuDe(dieta, activa.inicio, fecha)
  const ajuste = ajusteDe(activa, fecha)
  const ajustaId = recetaQueAjusta(dieta, menu.id)?.id
  const extra = kcalExtra(dieta, ajuste, tipo)
  const recetas = recetasDe(dieta, menu.id, tipo).map((r) =>
    recetaDelDia(r, tipo, r.id === ajustaId ? extra : 0),
  )
  return {
    fecha,
    tipo,
    menu,
    diaCiclo: diaDelCiclo(activa.inicio, fecha, dieta.ciclo.length),
    semana: semanaDeDieta(activa.inicio, fecha),
    recetas,
    total: sumar(recetas.map((r) => r.total)),
    pasos: ajuste.pasos,
  }
}

/** Media de un tipo de día en todo el ciclo (lo que se enseña antes de empezar y en la tarjeta de la dieta). */
export function mediaDelTipo(activa: DietaActiva, desde: string, tipo: TipoDia): Macros {
  // Todo el ciclo, dure lo que dure
  const n = Math.max(1, activa.dieta.ciclo.length)
  const dias = Array.from({ length: n }, (_, i) => diaDeDieta(activa, addDays(desde, i), tipo).total)
  const s = sumar(dias)
  return {
    kcal: Math.round(s.kcal / n),
    protein: r1(s.protein / n),
    carbs: r1(s.carbs / n),
    fat: r1(s.fat / n),
  }
}

/**
 * Sin rutina en Entreno: tus días de entreno repartidos por la semana (regla del prototipo, `rotationForecast`). Es una
 * propuesta («sugerido»): cada día se puede cambiar a mano.
 */
export function repartoSinRutina(fecha: string, diasPorSemana: number): TipoDia {
  const d = Math.min(7, Math.max(1, Math.round(diasPorSemana)))
  const k = ((daysBetween('2024-01-01', fecha) % 7) + 7) % 7
  return Math.floor(((k + 1) * d) / 7) > Math.floor((k * d) / 7) ? 'entreno' : 'descanso'
}

/** Una dieta vacía para crear la tuya: un menú que vale todos los días y sin recetas. */
export function dietaNueva(id: string, nombre: string): Dieta {
  return {
    formato: FORMATO,
    version: 1,
    id,
    nombre: nombre.trim() || 'Mi dieta',
    descripcion: '',
    menus: [{ id: 'A', nombre: 'Menú A' }],
    ciclo: Array.from({ length: 7 }, () => 'A'),
    recetas: [],
    fases: [],
    umbrales: UMBRALES,
    ejemplo: false,
  }
}

/** El siguiente nombre libre para un menú: «B», «C»… */
export function siguienteMenu(dieta: Dieta): Menu {
  const usados = new Set(dieta.menus.map((m) => m.id))
  const letra = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !usados.has(l)) ?? String(usados.size + 1)
  return { id: letra, nombre: `Menú ${letra}` }
}
