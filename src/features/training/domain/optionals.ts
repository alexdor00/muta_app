import type { PriorityChoice } from './priorities.ts'
import type { Day, Exercise, ProgramData as Program } from './program.ts'

// Ejercicios «opcionales» de las rutinas que los marcan en su documento original («(optional)»): el cuello
// de Fuerza e hipertrofia, la plancha… Salen en la rutina como una fila que se hace o se quita. Por defecto
// se hacen, tal como están en la rutina. (Los de MUTA siguen sus propias reglas: priorities.ts.)

const MARK = /\boptional\b/i
/** Los huecos de punto débil también dicen «(optional)», pero se eligen con su propio selector. */
const WEAK = /^(Weak Point Exercise|UPPER BODY WEAK POINT|LOWER BODY WEAK POINT)/i

const originalOf = (e: Exercise) => String(e.originalName ?? e.name)
const isMarked = (e: Exercise) => !e.slot && MARK.test(originalOf(e)) && !WEAK.test(originalOf(e))

/** ¿Tiene ejercicios marcados como opcionales en el original? */
export const hasMarkedOptionals = (program: Program): boolean =>
  program.blocks.some((b) =>
    b.weeks.some((w) =>
      w.days.some(
        (d) => 'exercises' in (d as Day) && (d as { exercises: Exercise[] }).exercises.some(isMarked),
      ),
    ),
  )

/** Marca cada opcional con tu decisión: `false` en `optionals` lo quita; sin decir, se hace. */
export function applyMarkedOptionals<P extends Program>(program: P, choice: PriorityChoice | null): P {
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
              if (!isMarked(e)) return e
              const key = originalOf(e)
              const off = choice?.optionals[key] === false
              return {
                ...e,
                slot: { kind: 'optional', key, off, why: off ? 'hand' : null, options: [], chosen: null },
              }
            }),
          }
        }),
      })),
    })),
  }
}
