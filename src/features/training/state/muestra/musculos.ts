// DATOS DE PRUEBA (ver datos.ts): lo que eliges en la ficha de cada músculo (Mantener, Desarrollar o Prioridad, o tu
// rango a mano). Vive en memoria hasta que el plan real lo guarde.
import { signal } from '@preact/signals'
import type { Level } from '../../domain/catalog.ts'
import { rangeFor, type Mode, type MuscleId, type Range } from '../../domain/muscles.ts'

/** El nivel de la persona de prueba. */
export const NIVEL_MUESTRA: Level = 'intermediate'

const elecciones = signal<Partial<Record<MuscleId, { modo: Mode; propio: Range | null }>>>({})

/** El modo elegido (Desarrollar si no se eligió) y el rango que vale: el tuyo a mano o el del modo. */
export function rangoMusculo(m: MuscleId): { modo: Mode; rango: Range; propio: boolean } {
  const e = elecciones.value[m]
  const modo = e?.modo ?? 'develop'
  return { modo, rango: e?.propio ?? rangeFor(m, NIVEL_MUESTRA, modo), propio: Boolean(e?.propio) }
}

/** Elegir un modo vuelve al rango recomendado (quita el tuyo a mano). */
export function elegirModo(m: MuscleId, modo: Mode): void {
  elecciones.value = { ...elecciones.value, [m]: { modo, propio: null } }
}

export function rangoPropio(m: MuscleId, rango: Range): void {
  elecciones.value = { ...elecciones.value, [m]: { modo: rangoMusculo(m).modo, propio: rango } }
}
