// Lo que eliges en la ficha de cada músculo (Mantener, Desarrollar o Prioridad, o tu
// rango a mano). Se guarda con tu plan (use-cases/training.ts).
import { signal } from '@preact/signals'
import type { Level } from '../domain/catalog.ts'
import { rangeFor, type Mode, type MuscleId, type Range } from '../domain/muscles.ts'
import { tuPlan } from './plan.ts'

/** Tu nivel (el del perfil; intermedio si aún no hay plan). */
export const nivelDelPlan = (): Level =>
  tuPlan.value.status === 'ready' ? tuPlan.value.nivel : 'intermediate'

export type EleccionMusculo = { modo: Mode; propio: Range | null }

export const elecciones = signal<Partial<Record<MuscleId, EleccionMusculo>>>({})

/** El modo elegido (Desarrollar si no se eligió) y el rango que vale: el tuyo a mano o el del modo. */
export function rangoMusculo(m: MuscleId): { modo: Mode; rango: Range; propio: boolean } {
  const e = elecciones.value[m]
  const modo = e?.modo ?? 'develop'
  return { modo, rango: e?.propio ?? rangeFor(m, nivelDelPlan(), modo), propio: Boolean(e?.propio) }
}

/** Elegir un modo vuelve al rango recomendado (quita el tuyo a mano). */
export function elegirModo(m: MuscleId, modo: Mode): void {
  elecciones.value = { ...elecciones.value, [m]: { modo, propio: null } }
}

export function rangoPropio(m: MuscleId, rango: Range): void {
  elecciones.value = { ...elecciones.value, [m]: { modo: rangoMusculo(m).modo, propio: rango } }
}
