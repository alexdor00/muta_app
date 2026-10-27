// Ajuste de una rutina de nivel intermedio para un principiante (docs/conocimiento, Parte II §2 y §4):
// - Volumen de principiante ≈ intermedio × 0,6–0,7 → cada ejercicio con ×0,7 series (mínimo 1).
// - Principiante: RIR 3 en compuestos pesados (RPE 7) y RIR 2 en el resto (RPE 8).
// Los valores originales se guardan en `original` para poder deshacerlo.

export const BEGINNER_SETS_FACTOR = 0.7

export type AdaptableExercise = {
  sets: number | string | null
  rpe: string | null
  percent1RM: string | null
  kind?: 'heavy' | 'compound' | 'isolation'
  original?: { sets: number | string | null; rpe: string | null }
}

export function beginnerSets(sets: number): number {
  return Math.max(1, Math.round(sets * BEGINNER_SETS_FACTOR))
}

export function adaptForBeginner<T extends AdaptableExercise>(exercise: T): T {
  const original = exercise.original ?? { sets: exercise.sets, rpe: exercise.rpe }
  const sets = typeof exercise.sets === 'number' ? beginnerSets(exercise.sets) : exercise.sets
  // Con %1RM manda el porcentaje; solo se ajusta el RPE cuando la rutina lo usa.
  const rpe = exercise.percent1RM ? exercise.rpe : exercise.kind === 'heavy' ? '7' : '8'
  return { ...exercise, sets, rpe, original }
}

/** Aplica el ajuste a todos los ejercicios de un programa. */
export function adaptProgramForBeginner<
  P extends { blocks: { weeks: { days: ({ exercises: AdaptableExercise[] } | { rest: true })[] }[] }[] },
>(program: P): P {
  return {
    ...program,
    blocks: program.blocks.map((block) => ({
      ...block,
      weeks: block.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) =>
          'exercises' in day ? { ...day, exercises: day.exercises.map(adaptForBeginner) } : day,
        ),
      })),
    })),
  }
}
