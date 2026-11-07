// Lo que se ve de las recetas y de tus menús: los platos (recetario, de ejemplo y tuyos) con tus cambios, tus menús y tu
// semana, los gramos de cada comida ajustados a tu objetivo, lo de hoy y lo que propone tu nutricionista. Lo carga y
// guarda use-cases/recipes.ts y menu.ts; aquí no se guarda nada.
import { computed, signal } from '@preact/signals'
import { addDays } from '../../../shared/lib/format.ts'
import { ajustar, mejoresPara, REPARTO, repartir, totalCon } from '../domain/fit.ts'
import { COMIDAS, type ComidaId, type Macros } from '../domain/food.ts'
import {
  loDeHoy,
  menuDelDia,
  menuVacio,
  semanaDesde,
  totalDelDia,
  type Hueco,
  type MenuSemanal,
} from '../domain/menu.ts'
import { gramosEnCrudo, parejaEnCrudo } from '../domain/kitchen.ts'
import { propuestasDelMenu } from '../domain/menuCoach.ts'
import { cambioEn, platoCon, type Plato, type Productos, type Recetario } from '../domain/recipes.ts'
import { alimentoPorId, apuntesDia, base, hoy, objetivoDelDia, objetivoDia, totalDia } from './comida.ts'

// Lo que las pantallas necesitan del dominio (no lo importan directamente)
export {
  ajustar,
  cuadrarDia,
  desvio,
  llegaHasta,
  mejoresPara,
  REPARTO,
  repartir,
  totalCon,
} from '../domain/fit.ts'
export type { Ajuste, Encaje } from '../domain/fit.ts'
export {
  clave,
  diaSemana,
  diasDelMenu,
  huecoDe,
  huecosDelDia,
  MAX_MENUS,
  menuDelDia,
  NOMBRE_DIA,
  paraCocinar,
  semanaDesde,
} from '../domain/menu.ts'
export type { Avisos, Cocinado, Hecho, Hueco, MenuPlan, MenuSemanal, Tarea } from '../domain/menu.ts'
export type { PropuestaMenu } from '../domain/menuCoach.ts'
export { buscarPlatos, MACROS, vaCon } from '../domain/recipes.ts'
export type { CategoriaPlato, IngredientePlato, MacroId, Plato } from '../domain/recipes.ts'

/** El recetario (el tuyo de private/ o, si no hay, los platos de ejemplo del prototipo). */
export const recetario = signal<Recetario | null>(null)
export const estadoRecetas = signal<'sin-cargar' | 'cargando' | 'listo'>('sin-cargar')
export const platosTuyos = signal<Plato[]>([])
export const menu = signal<MenuSemanal>(menuVacio())
export const productos = signal<Productos | null>(null)
/** La foto de cada plato del recetario (por id). */
export const fotos = signal<Record<string, string>>({})

/** Los platos tal como vienen (sin tus cambios). */
export const platos = computed(() => [...(recetario.value?.platos ?? []), ...platosTuyos.value])

/** Un plato con tus cambios de ese día (tu marca, otro alimento). */
export function platoPorId(id: string, fecha = hoy.value): Plato | null {
  const p = platos.value.find((x) => x.id === id)
  return p ? platoCon(p, productos.value, alimentoPorId, fecha) : null
}

/** El plato tal como viene (sin tus cambios). */
export const platoOriginal = (id: string) => platos.value.find((x) => x.id === id) ?? null

/** El cambio de un ingrediente de un plato un día (null: como viene). */
export const cambioDe = (p: Plato, k: number, fecha = hoy.value) => cambioEn(productos.value, p, k, fecha)

/** Las categorías con sus platos, en el orden del recetario; los de ejemplo y los tuyos al final. */
export const categorias = computed(() => {
  const r = recetario.value
  const lista = (r?.categorias ?? []).map((c) => ({
    ...c,
    platos: r!.platos.filter((p) => p.categoria === c.id),
  }))
  const ejemplo = r?.platos.filter((p) => p.origen === 'ejemplo') ?? []
  if (ejemplo.length) lista.push({ id: 'ejemplo', nombre: 'De ejemplo', platos: ejemplo })
  if (platosTuyos.value.length) lista.push({ id: 'tuyos', nombre: 'Tuyos', platos: platosTuyos.value })
  return lista.filter((c) => c.platos.length)
})

/** Lo que lleva un plato con unos gramos (o los suyos) y unas raciones. */
export function totalDePlato(p: Plato, gramos?: readonly (number | null)[], veces = 1): Macros {
  return totalCon(p, gramos ?? p.ingredientes.map((i) => i.gramos), [], veces)
}

/** Lo que le toca a una comida de un día: su parte de tu objetivo (reparto sugerido). */
export function objetivoDeComida(fecha: string, comida: ComidaId): Macros | null {
  const o = objetivoDelDia(fecha)
  if (!o) return null
  const f = REPARTO[comida]
  return { kcal: o.kcal * f, protein: o.protein * f, carbs: o.carbs * f, fat: o.fat * f }
}

const cache = new Map<string, (number | null)[]>()

/** Los gramos de un plato en una comida de un día: ajustados a lo que le toca (si el plato se ajusta). */
export function gramosDeHueco(h: Hueco, p: Plato): (number | null)[] {
  const o = objetivoDeComida(h.fecha, h.comida)
  const fijo = menu.value.menus.find((x) => x.id === h.menu)?.fijos?.includes(h.comida)
  if (!o || !p.ajustable || fijo) return p.ingredientes.map((i) => i.gramos)
  const k = `${p.id}|${p.total.kcal}|${p.ingredientes.map((i) => i.alimentoId).join(',')}|${o.kcal}|${o.protein}`
  let g = cache.get(k)
  if (!g) {
    g = ajustar(p, o).gramos
    cache.set(k, g)
  }
  return g
}

/** Lo que lleva una comida de un día con tu menú. */
export function totalDelHueco(h: Hueco): Macros | null {
  const p = platoPorId(h.plato, h.fecha)
  return p ? totalCon(p, gramosDeHueco(h, p)) : null
}

/** Lo que suma un día con tu menú. */
export const totalDeMenu = (fecha: string) => totalDelDia(menu.value, fecha, totalDelHueco)

/** Lo que te falta en el día que ves (nunca menos de 0). */
export const faltaDia = computed<Macros | null>(() => {
  const o = objetivoDia.value
  if (!o) return null
  const t = totalDia.value
  return {
    kcal: Math.max(0, o.kcal - t.kcal),
    protein: Math.max(0, o.protein - t.protein),
    carbs: Math.max(0, o.carbs - t.carbs),
    fat: Math.max(0, o.fat - t.fat),
  }
})

/** Las comidas del día que ves sin nada apuntado. */
export const comidasQueQuedan = computed<ComidaId[]>(() =>
  COMIDAS.map((c) => c.id).filter((c) => !apuntesDia.value.some((a) => a.comida === c)),
)

/** La siguiente comida sin apuntar y lo que le toca de lo que falta. */
export const siguiente = computed(() => {
  const falta = faltaDia.value
  const quedan = comidasQueQuedan.value
  if (!falta || !quedan.length || falta.kcal < 50) return null
  const comida = quedan[0]
  return { comida, objetivo: repartir(falta, quedan)[comida] }
})

/** Los platos que mejor encajan en la siguiente comida, ya ajustados. */
export const paraLaSiguiente = computed(() => {
  const s = siguiente.value
  return s ? mejoresPara(platos.value, s.comida, s.objetivo, 6) : []
})

/** Lo de hoy con hora (la compra y lo que cocinas). */
export const tareasDeHoy = computed(() => loDeHoy(menu.value, hoy.value))

/** Lo que propone tu nutricionista para tus menús (cada uno en su próximo día). */
export const propuestas = computed(() =>
  propuestasDelMenu(menu.value, semanaDesde(hoy.value), {
    platos: platos.value,
    objetivoDe: objetivoDelDia,
    objetivoDeComida,
    totalDe: totalDelHueco,
  }),
)

/** El menú de un día si ya tiene platos (null si no). */
export function menuConPlatos(fecha: string) {
  const m = menuDelDia(menu.value, fecha)
  return m && Object.keys(m.platos).length ? m : null
}

/** Mañana. */
export const manana = computed(() => addDays(hoy.value, 1))

/** La foto del plato de un apunte (si salió de un plato con foto). */
export function fotoDeApunte(receta: string | undefined): string | null {
  return receta ? (fotos.value[receta] ?? null) : null
}

/** Lo cocido de la base (cereales y legumbres) con su pareja en crudo. */
const parejasEnCrudo = computed(() => {
  const lista = base.value ?? []
  return new Map(
    lista.flatMap((a) => {
      const crudo = parejaEnCrudo(a, lista)
      return crudo ? [[a.id, { cocido: a, crudo }] as const] : []
    }),
  )
})

/** «≈ 90 g en crudo» para unos gramos de arroz, pasta o legumbre cocidos; null si no es de eso o no se sabe. */
export function enCrudo(alimentoId: string | null, gramos: number | null): string | null {
  const par = alimentoId && gramos ? parejasEnCrudo.value.get(alimentoId) : null
  return par ? `≈ ${gramosEnCrudo(gramos!, par.cocido, par.crudo)} g en crudo` : null
}
