// Lo que se ve de las recetas y del menú: los platos (recetario, de ejemplo y tuyos), tus productos, tu menú de la semana,
// lo de hoy y lo que propone tu nutricionista. Lo carga y guarda use-cases/recipes.ts; aquí no se guarda nada.
import { computed, signal } from '@preact/signals'
import { addDays } from '../../../shared/lib/format.ts'
import { mejoresPara, repartir, totalCon } from '../domain/fit.ts'
import { COMIDAS, type ComidaId, type Macros } from '../domain/food.ts'
import {
  loDeHoy,
  menuVacio,
  semanaDesde,
  totalDeHueco,
  type Hueco,
  type MenuSemanal,
} from '../domain/menu.ts'
import { propuestasDelMenu } from '../domain/menuCoach.ts'
import { productoEn, valoresCon, type Plato, type Productos, type Recetario } from '../domain/recipes.ts'
import { alimentoPorId, apuntesDia, hoy, objetivoDelDia, objetivoDia, totalDia } from './comida.ts'

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
  huecoDe,
  huecosDelDia,
  paraCocinar,
  semanaDesde,
  totalDeHueco,
  totalDelDia,
} from '../domain/menu.ts'
export type { Avisos, Cocinado, Hecho, Hueco, MenuSemanal, Tarea } from '../domain/menu.ts'
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

export const platos = computed(() => [...(recetario.value?.platos ?? []), ...platosTuyos.value])

export function platoPorId(id: string): Plato | null {
  return platos.value.find((p) => p.id === id) ?? null
}

/** Las categorías con sus platos, en el orden del recetario; las tuyas al final. */
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

/** El producto tuyo de un ingrediente de un plato (null: el del plato). */
export function productoDe(p: Plato, k: number): string | null {
  return productoEn(productos.value, p, k)
}

/** Los valores con los que cuenta cada ingrediente de un plato (tus productos). */
export function valoresDe(p: Plato): (Macros | null)[] {
  return valoresCon(productos.value, p, (id) => {
    const a = alimentoPorId(id)
    return a ? { kcal: a.kcal, protein: a.protein, carbs: a.carbs, fat: a.fat } : null
  })
}

/** Lo que lleva un plato con unos gramos (o los suyos) y tus productos. */
export function totalDePlato(p: Plato, gramos?: readonly (number | null)[], veces = 1): Macros {
  return totalCon(p, gramos ?? p.ingredientes.map((i) => i.gramos), valoresDe(p), veces)
}

/** Lo que lleva un hueco del menú, con tus productos. */
export function totalDelHueco(h: Hueco): Macros | null {
  const p = platoPorId(h.plato)
  return p ? totalDeHueco(h, p, valoresDe(p)) : null
}

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

/** Lo de hoy, con tu menú. */
export const tareasDeHoy = computed(() => loDeHoy(menu.value, hoy.value))

/** Lo que propone tu nutricionista para los próximos 7 días. */
export const propuestas = computed(() =>
  propuestasDelMenu(menu.value, semanaDesde(hoy.value), platos.value, objetivoDelDia),
)

/** La semana que ves en el menú (empieza hoy; con ‹ › se cambia). */
export const semanaVista = signal(hoy.value)
export const semanaDelMenu = computed(() => semanaDesde(semanaVista.value))

/** Mañana (para «Para mañana» en lo de hoy). */
export const manana = computed(() => addDays(hoy.value, 1))

/** La foto del plato de un apunte (si salió de un plato con foto). */
export function fotoDeApunte(receta: string | undefined): string | null {
  return receta ? (fotos.value[receta] ?? null) : null
}
