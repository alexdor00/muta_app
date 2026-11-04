// Cobertura según el método (docs/conocimiento/02-reglas.md §7): lo que pide cada músculo y, si falta, qué sugerir. La
// tabla vive en shared/content/coverage.json; aquí, cómo se compara con los ejercicios de tu plan.
import type { MuscleId } from './muscles.ts'

/** Una parte de lo que pide un músculo: la cubre un ejercicio de esos `ids`, o de ese `patron` (y `primario`, si se dice). */
export type ParteCobertura = {
  falta: string
  ids?: string[]
  patron?: string
  primario?: MuscleId
  /** Ejercicios de la biblioteca que la cubren (ids). */
  sugiere: string[]
}

export type ReglaCobertura = { musculo: MuscleId; pide: string; fuente: string; partes: ParteCobertura[] }

/** Lo que importa de un ejercicio de tu plan (de la biblioteca). */
export type EjercicioCubre = { id: string; pattern: string; primary: MuscleId }

const cubre = (p: ParteCobertura, e: EjercicioCubre) =>
  Boolean(p.ids?.includes(e.id)) ||
  (p.patron !== undefined && p.patron === e.pattern && (!p.primario || p.primario === e.primary)) ||
  (p.patron === undefined && p.primario !== undefined && p.primario === e.primary)

/**
 * Cada músculo de la tabla con lo que le falta en tu plan (`faltan`, en el orden de la tabla) o nada (bien cubierto).
 * Primero los que tienen algo por revisar.
 */
export function cobertura(reglas: readonly ReglaCobertura[], ejercicios: readonly EjercicioCubre[]) {
  const todos = reglas.map((r) => ({
    ...r,
    faltan: r.partes.filter((p) => !ejercicios.some((e) => cubre(p, e))),
  }))
  return {
    porRevisar: todos.filter((r) => r.faltan.length > 0),
    bien: todos.filter((r) => r.faltan.length === 0),
  }
}
