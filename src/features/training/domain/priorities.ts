import type { Level } from './catalog.ts'
import { sessionMinutes } from './programInfo.ts'
import type { Day, Exercise, ProgramData as Program } from './program.ts'

// Prioridades de las rutinas de MUTA: tienen ejercicios opcionales (huecos «opc») que dependen de lo
// que quieras mejorar (docs/conocimiento, reglas del generador):
// 3. Hombro anterior directo: solo si es prioridad. Hombro posterior: se quita a principiantes salvo prioridad.
// 6. Tiempo: mientras una sesión pase de tus minutos (75 por defecto), quitar el último opcional no
//    prioritario; si no hay, −1 serie al ejercicio con más series no prioritario.
// Máximo 4 músculos en prioridad. Los demás opcionales (aductores, cuádriceps o glúteo extra) se incluyen,
// y puedes quitarlos. Todo es opcional: sin elegir nada se aplican las reglas por defecto.

export const MAX_PRIORITIES = 4
/** Minutos por sesión por defecto (docs/conocimiento). */
export const DEFAULT_MINUTES = 75
/** Series mínimas por ejercicio al recortar por tiempo (el mínimo que fija el generador). */
const MIN_SETS = 2

export type PriorityChoice = {
  /** Músculos prioritarios (como se llaman en la rutina). */
  priorities: string[]
  /** Lo que has decidido a mano de cada opcional; el resto sigue las reglas. */
  optionals: Record<string, boolean>
  /** Ejercicio del documento que pones en un opcional (clave del opcional → nombre). */
  alternatives?: Record<string, string>
  /** Minutos máximos por sesión: sin decir, 75; `null`, sin límite. */
  maxMinutes?: number | null
}

export type OptionalExercise = { key: string; name: string; muscle: string; days: string[] }

const rows = (program: Program) =>
  program.blocks.flatMap((b) =>
    b.weeks.flatMap((w) =>
      w.days.flatMap((d) => ('exercises' in d ? d.exercises.map((e) => ({ e, day: d.name })) : [])),
    ),
  )
const keyOf = (e: Exercise) => `${e.muscle}|${e.name}`
const setsOf = (e: Exercise) =>
  typeof e.sets === 'number' ? e.sets : Number.parseInt(String(e.sets ?? ''), 10) || 0

/** Los ejercicios opcionales distintos de la rutina (uno por nombre y músculo). */
export function optionalsOf(program: Program): OptionalExercise[] {
  const out = new Map<string, OptionalExercise>()
  for (const { e, day } of rows(program)) {
    if (!e.optional || !e.muscle) continue
    const key = keyOf(e)
    const found = out.get(key) ?? { key, name: e.name, muscle: e.muscle, days: [] }
    if (!found.days.includes(day)) found.days.push(day)
    out.set(key, found)
  }
  return [...out.values()]
}

/** Los músculos de la rutina, en el orden en que salen. */
export function musclesOf(program: Program): string[] {
  return [...new Set(rows(program).flatMap(({ e }) => (e.muscle ? [e.muscle] : [])))]
}

export const hasPriorities = (program: Program) => optionalsOf(program).length > 0

/** ¿Entra este opcional según las reglas, antes de que decidas nada a mano? */
export function defaultOn(muscle: string, priority: boolean, level: Level): boolean {
  if (muscle === 'Hombro anterior') return priority
  if (muscle === 'Hombro posterior') return priority || level !== 'beginner'
  return true
}

/** Por qué entra o no por defecto (para decirlo en la interfaz). */
export function reasonOf(muscle: string): string | null {
  if (muscle === 'Hombro anterior') return 'Ya trabaja en todos los press: solo si es prioridad'
  if (muscle === 'Hombro posterior') return 'Se quita a principiantes salvo prioridad'
  return null
}

export function isIncluded(o: OptionalExercise, choice: PriorityChoice | null, level: Level): boolean {
  const manual = choice?.optionals[o.key]
  if (manual !== undefined) return manual
  return defaultOn(o.muscle, !!choice?.priorities.includes(o.muscle), level)
}

/** Minutos por sesión que se aplican: los tuyos, 75 por defecto, o ninguno. */
export const limitOf = (choice: PriorityChoice | null): number | null =>
  choice?.maxMinutes === undefined ? DEFAULT_MINUTES : choice.maxMinutes

const isOff = (e: Exercise) => e.slot?.kind === 'optional' && e.slot.off

/**
 * Regla de tiempo: mientras la sesión pase del límite, se quita el último opcional que no sea
 * prioritario (ni lo hayas puesto tú a mano); si no queda ninguno, −1 serie al ejercicio con más series
 * no prioritario. Los opcionales quitados se quedan en la rutina marcados, para poder volver a ponerlos.
 */
function fitDay(
  exercises: Exercise[],
  limit: number,
  protectedMuscles: Set<string>,
  manual: Set<string>,
): Exercise[] {
  let list = exercises
  let guard = 100
  while (sessionMinutes(list.filter((e) => !isOff(e))) > limit && guard--) {
    const lastOptional = list.findLastIndex(
      (e) => e.optional && !isOff(e) && !protectedMuscles.has(String(e.muscle)) && !manual.has(keyOf(e)),
    )
    if (lastOptional >= 0) {
      list = list.map((e, i) =>
        i === lastOptional && e.slot?.kind === 'optional'
          ? { ...e, slot: { ...e.slot, off: true, why: 'time' } }
          : e,
      )
      continue
    }
    const most = list
      .filter((e) => !isOff(e) && !protectedMuscles.has(String(e.muscle)) && setsOf(e) > MIN_SETS)
      .sort((a, b) => setsOf(b) - setsOf(a))[0]
    if (!most) break
    list = list.map((e) =>
      e === most
        ? {
            ...e,
            original: e.original ?? { sets: e.sets ?? null, rpe: (e.rpe as string | null) ?? null },
            sets: setsOf(e) - 1,
          }
        : e,
    )
  }
  return list
}

/** La rutina con tus prioridades: cada opcional marcado como puesto o quitado, y ajustada a tus minutos. */
export function applyPriorities<P extends Program>(
  program: P,
  choice: PriorityChoice | null,
  level: Level,
): P {
  const options = new Map(optionalsOf(program).map((o) => [o.key, o]))
  const limit = limitOf(choice)
  if (!options.size && limit == null) return program
  const prio = new Set(choice?.priorities ?? [])
  const manual = new Set(
    Object.entries(choice?.optionals ?? {})
      .filter(([, on]) => on)
      .map(([k]) => k),
  )
  return {
    ...program,
    blocks: program.blocks.map((block) => ({
      ...block,
      weeks: block.weeks.map((week) => ({
        ...week,
        days: week.days.map((day): Day => {
          if (!('exercises' in day)) return day
          let exercises = day.exercises.map((e): Exercise => {
            const o = e.optional ? options.get(keyOf(e)) : undefined
            if (!o) return e
            const on = isIncluded(o, choice, level)
            const hand = choice?.optionals[o.key] !== undefined
            const allowed = Array.isArray(e.substitutions) ? (e.substitutions as string[]) : []
            const wanted = choice?.alternatives?.[o.key]
            const chosen = wanted && allowed.includes(wanted) ? wanted : null
            return {
              ...e,
              slot: {
                kind: 'optional',
                key: o.key,
                off: !on,
                why: on ? null : hand ? 'hand' : 'rule',
                options: allowed,
                chosen,
              },
            }
          })
          if (limit != null) exercises = fitDay(exercises, limit, prio, manual)
          exercises = exercises.map((e) =>
            e.slot?.kind === 'optional' && e.slot.chosen ? { ...e, name: e.slot.chosen } : e,
          )
          return { ...day, exercises }
        }),
      })),
    })),
  }
}

/** Opcionales que la regla de tiempo ha quitado (tras aplicar tus prioridades). */
export function trimmedKeys(program: Program): Set<string> {
  return new Set(
    rows(program).flatMap(({ e }) =>
      e.slot?.kind === 'optional' && e.slot.off && e.slot.why === 'time' ? [e.slot.key] : [],
    ),
  )
}
