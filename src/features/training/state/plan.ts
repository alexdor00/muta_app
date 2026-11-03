// Tu plan de verdad (lo carga use-cases/training.ts): la rutina guardada con tus elecciones, dónde vas y los entrenos
// terminados. Aquí solo se lee: nada se guarda desde el estado.
import { computed, signal } from '@preact/signals'
import type { Level } from '../domain/catalog.ts'
import { ultimaVez, type Entreno } from '../domain/workoutHistory.ts'
import type { EjercicioPlan, Rotacion, SesionPlan } from '../domain/workoutPlan.ts'

export type PlanListo = {
  status: 'ready'
  programId: string
  /** El nombre de la rutina («MUTA · Cuerpo completo A/B»). */
  rutina: string
  nivel: Level
  rotacion: Rotacion
  /** «Semana 2 de 6» o «Fase 1 · semana 2 de 6». */
  donde: string
  /** Las sesiones de la semana que toca, sin la vez anterior (va en `sesiones`). */
  semana: SesionPlan[]
}

export type EstadoPlan = { status: 'loading' } | { status: 'none' } | PlanListo

export const tuPlan = signal<EstadoPlan>({ status: 'loading' })

/** Los entrenos terminados (almacén `workouts`), en cualquier orden. */
export const entrenos = signal<Entreno[]>([])

/** Las sesiones de la semana con lo que hiciste la última vez en cada ejercicio. */
export const sesiones = computed<SesionPlan[]>(() => {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return []
  return plan.semana.map((s) => ({
    ...s,
    ejercicios: s.ejercicios.map((e) => ({ ...e, ultima: ultimaVez(entrenos.value, e.nombre) })),
  }))
})

/** La sesión de una sigla («s1» o «S1»), o null si no está en la semana. */
export function sesionDe(sigla: string): SesionPlan | null {
  return sesiones.value.find((s) => s.sigla.toLowerCase() === sigla.toLowerCase()) ?? null
}

/** La sesión que toca (la siguiente de la rotación). */
export const tocaHoy = computed<SesionPlan | null>(() => {
  const plan = tuPlan.value
  return plan.status === 'ready'
    ? (sesiones.value[plan.rotacion.siguiente] ?? sesiones.value[0] ?? null)
    : null
})

/** Días de descanso que deja tu semana (7 menos sus sesiones), para la racha. */
export const descansosPorSemana = computed(() => Math.max(0, 7 - sesiones.value.length))

export type Tono = 1 | 2 | 3 | 4

/** Color de la tarjeta de una sesión: fijo, por su orden en la semana (1 lima, 2 rayas, 3 naranja, 4 negro). */
export function tonoDe(sigla: string): Tono {
  const i = sesiones.value.findIndex((s) => s.sigla === sigla)
  return ((Math.max(0, i) % 4) + 1) as Tono
}

/** «7 ejercicios · 24 series · 65 min». */
export function detalleSesion(s: SesionPlan): string {
  const series = s.ejercicios.reduce((n, e) => n + e.series, 0)
  return `${s.ejercicios.length} ejercicios · ${series} series · ${s.minutos} min`
}

/** Dónde está un ejercicio en tu semana (la primera sesión que lo lleva), o null si no está. */
export function enTuPlan(nombre: string): { sigla: string; indice: number; e: EjercicioPlan } | null {
  for (const s of sesiones.value) {
    const indice = s.ejercicios.findIndex((e) => e.nombre === nombre)
    if (indice >= 0) return { sigla: s.sigla, indice, e: s.ejercicios[indice] }
  }
  return null
}

export type { EjercicioPlan, SesionPlan } from '../domain/workoutPlan.ts'
export { desdeBiblioteca } from '../domain/workoutPlan.ts'
export { progresoDeSesion, semanaDe, seriesPorMusculo } from '../domain/workoutHistory.ts'
export { notaSugerido } from '../domain/workoutPlan.ts'
