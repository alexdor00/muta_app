// Lo que se ve de tu dieta: el menú de cada día, tu semana, la compra y la consulta semanal. Lo carga y guarda
// use-cases/nutritionStore.ts (y lo cambian use-cases/diet.ts, shopping.ts y consult.ts); aquí no se guarda nada.
import { computed, signal } from '@preact/signals'
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import type { Propuesta, Revision } from '../domain/consult.ts'
import {
  ajusteDe,
  diaDeDieta,
  faseDe,
  kcalExtra,
  mediaDelTipo,
  recetaDelDia,
  recetaQueAjusta,
  type DiaDeDieta,
  type Receta,
  type RecetaDelDia,
  type TipoDia,
} from '../domain/diet.ts'
import { letraDia } from '../domain/week.ts'
import { diaVisto, dias, dieta, hoy, tipoDe } from './comida.ts'

// Lo que las pantallas necesitan del dominio
export { TIPOS_DIA, FACTOR_ARROZ, PASOS, recetaDelDia, siguienteMenu } from '../domain/diet.ts'
export { mismoCodigo } from '../domain/barcode.ts'
export type {
  Dieta,
  DietaActiva,
  IngredienteDelDia,
  Menu,
  Receta,
  RecetaDelDia,
  TipoDia,
} from '../domain/diet.ts'
export { intercambios, NOMBRE_MACRO, COMPENSAR } from '../domain/swaps.ts'
export { arrozDe, factorDe, platoPor100, racionDeOlla } from '../domain/kitchen.ts'
export { SECCIONES } from '../domain/shopping.ts'
export { CINTURA, ESCALAS, SUENO } from '../domain/consult.ts'
export type { Decision, Propuesta, Revision } from '../domain/consult.ts'

/** El día con tu dieta (null sin dieta). */
export function diaDe(fecha: string): DiaDeDieta | null {
  return dieta.value ? diaDeDieta(dieta.value, fecha, tipoDe(fecha)) : null
}

/** El menú del día que ves en Comida · Hoy. */
export const menuDelDia = computed(() =>
  dieta.value ? diaDeDieta(dieta.value, diaVisto.value, tipoDe(diaVisto.value)) : null,
)

/** Los 7 días desde hoy: su menú y si son de entreno o de descanso. */
export const semanaDieta = computed(() => {
  const d = dieta.value
  if (!d) return []
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = addDays(hoy.value, i)
    const dia = diaDeDieta(d, fecha, tipoDe(fecha))
    return {
      fecha,
      letra: letraDia(fecha),
      tipo: dia.tipo,
      menu: dia.menu,
      hoy: i === 0,
      elegido: fecha in d.tipoElegido,
    }
  })
})

/** Tus cifras de entreno y de descanso (media del ciclo, desde hoy). */
export const cifrasDieta = computed(() => {
  const d = dieta.value
  if (!d) return null
  return { entreno: mediaDelTipo(d, hoy.value, 'entreno'), descanso: mediaDelTipo(d, hoy.value, 'descanso') }
})

/** La fase y el ajuste que valen hoy. */
export const ahoraDieta = computed(() => {
  const d = dieta.value
  if (!d) return null
  const ajuste = ajusteDe(d, hoy.value)
  return {
    ajuste,
    fase: faseDe(d.dieta, ajuste),
    semana: Math.floor(daysBetween(d.inicio, hoy.value) / 7) + 1,
  }
})

/** ¿Está apuntada una receta un día? */
export function apuntada(recetaId: string, fecha = diaVisto.value): boolean {
  return (dias.value[fecha] ?? []).some((a) => a.receta === recetaId)
}

/** Una receta de tu dieta por su id. */
export function recetaPorId(id: string): Receta | null {
  return dieta.value?.dieta.recetas.find((r) => r.id === id) ?? null
}

/** Una receta como toca hoy en un tipo de día: con lo que suma la consulta si es la que ajusta en su menú. */
export function recetaComoToca(r: Receta, tipo: TipoDia, raciones = 1): RecetaDelDia {
  const d = dieta.value
  const ajusta = d && r.menu ? recetaQueAjusta(d.dieta, r.menu)?.id === r.id : false
  const extra = d && ajusta ? kcalExtra(d.dieta, ajusteDe(d, hoy.value), tipo) : 0
  return recetaDelDia(r, tipo, extra, raciones)
}

/** ¿Tiene la receta una versión distinta el día de descanso? */
export function cambiaEnDescanso(r: Receta): boolean {
  return r.ingredientes.some((i) => i.gramos && i.gramos.entreno !== i.gramos.descanso)
}

/** La lista de la compra que llevas: desde qué día, para cuántos, lo que ya tienes y lo que añadiste. */
export type Compra = {
  id: 'compra'
  target: 'nutricion'
  desde: string
  dias: number
  tienes: string[]
  /** Raciones de más por receta (alguien más come ese plato). */
  extra: Record<string, number>
  propios: { id: string; nombre: string; seccion: string }[]
  /** Por días (lo de tu semana) o por menús (los que elijas, cuántas veces cada uno). */
  modo?: 'dias' | 'menus'
  /** Por menús: cuántas veces entra cada menú. */
  menus?: Record<string, number>
}

export const compra = signal<Compra | null>(null)

/** Lo que apuntaste en cada consulta (en `bodyLog`, tipo «checkin»), de más antigua a más nueva. */
export const revisiones = signal<Revision[]>([])

/** Lo que propuso el nutricionista en cada consulta y qué hiciste (almacén `coach`, área «dieta»). */
export type Consulta = {
  id: string
  area: 'dieta'
  /** hecho: sin propuesta; pendiente → aplicado o descartado; aplicado → deshecho. */
  status: 'hecho' | 'pendiente' | 'aplicado' | 'descartado' | 'deshecho'
  fecha: string
  semana: number
  titulo: string
  detalle: string
  propuestas: Propuesta[]
  /** La que aplicaste (o descartaste con «Ahora no»). */
  elegida: string | null
  /** El ajuste que se añadió al aplicar (para deshacerlo). */
  ajusteId: string | null
  createdAt: string
  updatedAt: string
}

export const consultas = signal<Consulta[]>([])

/** Cada cuántos días toca la consulta. */
export const CADA_CONSULTA = 7

/** La última consulta (o null). */
export const ultimaConsulta = computed(() =>
  consultas.value.length
    ? [...consultas.value].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)
    : null,
)

/** ¿Toca la consulta? A los 7 días de empezar la dieta y, después, cada 7 días. */
export const tocaConsulta = computed(() => {
  const d = dieta.value
  if (!d) return false
  const desde = ultimaConsulta.value?.fecha ?? d.inicio
  return daysBetween(desde, hoy.value) >= CADA_CONSULTA
})

/** El día de la próxima consulta. */
export const proximaConsulta = computed(() => {
  const d = dieta.value
  return d ? addDays(ultimaConsulta.value?.fecha ?? d.inicio, CADA_CONSULTA) : null
})
