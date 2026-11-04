// Tu plan de verdad (lo carga use-cases/training.ts): la rutina guardada con tus elecciones, dónde vas y los entrenos
// terminados. Aquí solo se lee: nada se guarda desde el estado.
import { computed, signal } from '@preact/signals'
import type { Level } from '../domain/catalog.ts'
import { descansosPendientes, hoyTocaDescanso } from '../domain/restDays.ts'
import { semanaDe, ultimaVez, type Entreno } from '../domain/workoutHistory.ts'
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
  /** Tras qué sesiones (1 = la primera) va un descanso obligatorio: los de la rutina o los que cambiaste. */
  descansos: number[]
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

/** Tu última sesión hecha de esta rutina (su número en la semana) y cuántos días hace (null si aún no has entrenado). */
function ultimoEntreno(hoy: string) {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return { hecha: null, dias: null }
  const fechas = entrenos.value.filter((x) => x.programId === plan.programId).map((x) => x.fecha)
  if (!fechas.length) return { hecha: null, dias: null }
  const ultima = fechas.reduce((x, y) => (x > y ? x : y))
  const dias = Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${ultima}T00:00:00Z`)) / 86_400_000)
  // La que hiciste es la anterior a la que toca
  return { hecha: plan.rotacion.siguiente === 0 ? plan.semana.length : plan.rotacion.siguiente, dias }
}

/** ¿Hoy toca un descanso obligatorio? (`hoy`, «2026-11-03»). Cuenta desde tu último entreno de esta rutina. */
export function descansasHoy(hoy: string): boolean {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return false
  const { hecha, dias } = ultimoEntreno(hoy)
  return hoyTocaDescanso(plan.descansos, hecha, dias)
}

/**
 * Tu semana de lunes a domingo: lo hecho con ✓ y, desde el primer día sin entrenar, las sesiones que tocan en su orden con
 * sus descansos obligatorios.
 */
export function tuSemana(hoy: string) {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return semanaDe(entrenos.value, hoy)
  const { hecha, dias } = ultimoEntreno(hoy)
  return semanaDe(entrenos.value, hoy, {
    orden: plan.semana.map((x) => x.sigla),
    siguiente: plan.rotacion.siguiente,
    tras: plan.descansos,
    pendientes: descansosPendientes(plan.descansos, hecha, dias),
  })
}

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
export { cortosDeSesiones, desdeBiblioteca, nombresDeSesiones } from '../domain/workoutPlan.ts'
export { descansosPorSesion, trasDe } from '../domain/restDays.ts'
export { progresoDeSesion, semanaDe, seriesPorMusculo } from '../domain/workoutHistory.ts'
export { notaSugerido } from '../domain/workoutPlan.ts'
export { anadir, cambiarPauta, claveDe, mover, pautaDe, quitar } from '../domain/routineEdit.ts'
export { EQUIPMENT_LABEL } from '../domain/exerciseLibrary.ts'
