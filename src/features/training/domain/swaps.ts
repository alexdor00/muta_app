import type { Slot } from './slots.ts'

// Sustituciones: muchos ejercicios traen en el propio programa otros que los pueden sustituir.
// Cada fila así se ve con un tono suave y, al pulsarla, se despliega con el original y sus sustitutos.
// La elección va por nombre del ejercicio original y vale para todas las semanas y días donde aparece.

/** Lo elegido: nombre del ejercicio original → nombre del sustituto. */
export type SwapChoice = Record<string, string>

type Exercise = { name: string; substitutions?: string[]; slot?: Slot; [key: string]: unknown }
type Day = { name: string; exercises: Exercise[] } | { rest: true }

/** Pone el sustituto elegido en cada fila con sustitutos; las filas con otra marca (hueco, opcional) no se tocan. */
export function applySwaps<P extends { blocks: { weeks: { days: unknown[] }[] }[] }>(
  program: P,
  swaps: SwapChoice | null,
): P {
  return {
    ...program,
    blocks: program.blocks.map((b) => ({
      ...b,
      weeks: b.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) => {
          const day = d as Day
          if (!('exercises' in day)) return d
          return {
            ...day,
            exercises: day.exercises.map((e): Exercise => {
              const options = e.substitutions ?? []
              if (e.slot || !options.length) return e
              const chosen = swaps?.[e.name]
              const picked = chosen && options.includes(chosen) ? chosen : null
              const slot: Slot = { kind: 'swap', key: e.name, options, chosen: picked }
              return picked ? { ...e, name: picked, substitutions: [], slot } : { ...e, slot }
            }),
          }
        }),
      })),
    })),
  }
}
