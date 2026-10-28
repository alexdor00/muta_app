import type { Level } from './catalog.ts'
import { muscleOf } from './muscleOf.ts'
import { rangeFor, type MuscleId } from './muscles.ts'
import { emphasisOf } from './programInfo.ts'
import { levelFromSets, weeklySets } from './programLevel.ts'

// Adapta una rutina a un nivel músculo a músculo (docs/conocimiento, Parte II §4 «calibración»):
// - Por debajo del rango: +1 serie al ejercicio con menos series del músculo
//   (máx. 4 por ejercicio, 5 en aislamientos; sin pasar de 11 series del músculo en la sesión).
// - Por encima: −1 serie al ejercicio con más series (primero aislamientos), mínimo 1.
// - Los músculos que la rutina trabaja como prioridad (especialización) usan el rango de prioridad.
// - Principiante: RIR 3 en compuestos pesados (RPE 7) y RIR 2 en el resto (RPE 8).
// Cada cambio guarda el valor original en `original`.

export const MAX_SETS_EXERCISE = 4
export const MAX_SETS_ISOLATION = 5
export const MAX_SETS_MUSCLE_SESSION = 11
export const NEW_EXERCISE_SETS = 2

export type AdaptExercise = {
  name: string
  originalName?: string
  muscle?: string
  group?: string | null
  kind?: 'heavy' | 'compound' | 'isolation'
  sets: number | string | null
  rpe: string | null
  percent1RM: string | null
  original?: { sets: number | string | null; rpe: string | null }
  /** Ejercicio añadido por la adaptación (no estaba en la rutina). */
  added?: boolean
  /** Ejercicio quitado por la adaptación (0 series; se enseña tachado). */
  removed?: boolean
}
type Day = { exercises: AdaptExercise[] } | { rest: true }
type Week = { week: number; days: Day[] }
type Block = { title?: string | null; weeks: Week[] }

const setsOf = (e: AdaptExercise) =>
  typeof e.sets === 'number' ? e.sets : Number.parseInt(String(e.sets ?? ''), 10)
const totalSets = (day: { exercises: AdaptExercise[] }) =>
  day.exercises.reduce((n, e) => n + (setsOf(e) || 0), 0)
const sessions = (week: Week) =>
  week.days.filter((d): d is { exercises: AdaptExercise[] } => 'exercises' in d)

function setSets(day: { exercises: AdaptExercise[] }, target: AdaptExercise, n: number) {
  // En programas por progresión, todas las filas del mismo grupo cambian a la vez.
  const rows = target.group ? day.exercises.filter((e) => e.group === target.group) : [target]
  for (const e of rows) {
    e.original ??= { sets: e.sets, rpe: e.rpe }
    e.sets = n
  }
}

/** Para qué son las series: ganar músculo (rango «desarrollar») o mantenerlo (rango «mantener»). */
export type SetsGoal = 'develop' | 'maintain'

function adaptWeek(week: Week, level: Level, daysPerWeek: number, goal: SetsGoal): Week {
  const copy: Week = structuredClone(week)
  const weekly = weeklySets(copy, daysPerWeek)
  const fit = levelFromSets(weekly)
  const factor = Math.min(1, daysPerWeek / Math.max(1, sessions(copy).length))
  const days = sessions(copy)

  // Solo los músculos que la rutina especializa de verdad (énfasis: exceso claro sobre «desarrollar»)
  // usan el rango de prioridad; el resto, el de su nivel. Así un principiante no hereda volumen de más.
  const emphasis = new Set(emphasisOf(weekly))
  for (const { muscle } of fit.perMuscle) {
    // Mantener: rango «mantener» salvo los de énfasis, que siguen en «desarrollar» (lo que hace
    // especial a la rutina no se pierde). Ganar: «desarrollar», o «prioridad» para los de énfasis.
    const special = emphasis.has(muscle)
    const range =
      goal === 'maintain'
        ? rangeFor(muscle, level, special ? 'develop' : 'maintain')
        : rangeFor(muscle, level, special ? 'priority' : 'develop')
    // Cambio en series del ciclo (la semana del archivo puede tener más sesiones que días reales)
    let current = weekly[muscle]!
    const step = factor
    // Mismo criterio que al contar (weeklySets): de un grupo de progresión solo cuenta su primera fila.
    const counts = (day: { exercises: AdaptExercise[] }, e: AdaptExercise) =>
      !e.group || day.exercises.find((x) => x.group === e.group) === e
    const candidates = () =>
      days.flatMap((day) =>
        day.exercises
          .filter(
            (e) => counts(day, e) && muscleOf(e) === muscle && Number.isFinite(setsOf(e)) && setsOf(e) > 0,
          )
          .map((e) => ({ day, e })),
      )
    const sessionSets = (day: { exercises: AdaptExercise[] }) =>
      day.exercises
        .filter(
          (e) => muscleOf(e) === muscle && (!e.group || day.exercises.find((x) => x.group === e.group) === e),
        )
        .reduce((n, e) => n + (setsOf(e) || 0), 0)

    let guard = 200
    while (current > range[1] + 1e-9 && guard--) {
      const pick = candidates()
        .filter(({ e }) => setsOf(e) > 1)
        .sort(
          (a, b) =>
            setsOf(b.e) - setsOf(a.e) || Number(b.e.kind === 'isolation') - Number(a.e.kind === 'isolation'),
        )[0]
      if (pick) {
        setSets(pick.day, pick.e, setsOf(pick.e) - 1)
        current -= step
        continue
      }
      // Todos a 1 serie y aún sobra: se quita un aislamiento (docs/conocimiento §4 «quitar un
      // opcional»), el último de la semana. Queda marcado como quitado y siempre queda al menos uno.
      const left = candidates()
      const drop =
        [...left].reverse().find(({ e }) => e.kind === 'isolation') ??
        (left.length > 1 ? left.at(-1) : undefined)
      if (!drop || left.length <= 1) break
      const removed = setsOf(drop.e)
      setSets(drop.day, drop.e, 0)
      drop.e.removed = true
      current -= removed * step
    }
    while (current < range[0] - 1e-9 && guard--) {
      const pick = candidates()
        .filter(({ day, e }) => {
          const cap = e.kind === 'isolation' ? MAX_SETS_ISOLATION : MAX_SETS_EXERCISE
          return setsOf(e) < cap && sessionSets(day) < MAX_SETS_MUSCLE_SESSION
        })
        .sort((a, b) => setsOf(a.e) - setsOf(b.e))[0]
      if (pick) {
        setSets(pick.day, pick.e, setsOf(pick.e) + 1)
        current += step
        continue
      }
      // Sin hueco en los ejercicios que ya hay: «ejercicio nuevo de 2 series en la sesión con
      // más hueco» (docs/conocimiento §4). Se usa el primer sustituto para variar, si lo hay.
      const model = candidates()[0]?.e
      if (!model) break
      const target = days
        .filter((day) => sessionSets(day) + NEW_EXERCISE_SETS <= MAX_SETS_MUSCLE_SESSION)
        .sort((a, b) => sessionSets(a) - sessionSets(b) || totalSets(a) - totalSets(b))[0]
      if (!target) break
      const subs = (model as { substitutions?: string[] }).substitutions ?? []
      target.exercises.push({
        ...structuredClone(model),
        name: subs[0] ?? model.name,
        group: null,
        sets: NEW_EXERCISE_SETS,
        original: { sets: 0, rpe: null },
        added: true,
      } as AdaptExercise)
      current += NEW_EXERCISE_SETS * step
    }
  }

  if (level === 'beginner') {
    for (const day of days) {
      for (const e of day.exercises) {
        if (e.percent1RM) continue
        const rpe = e.kind === 'heavy' ? '7' : '8'
        if (e.rpe !== rpe) {
          e.original ??= { sets: e.sets, rpe: e.rpe }
          e.rpe = rpe
        }
      }
    }
  }
  return copy
}

/** La rutina adaptada al nivel, semana a semana. No modifica la original. */
export function adaptToLevel<P extends { blocks: Block[] }>(
  program: P,
  level: Level,
  daysPerWeek: number,
  goal: SetsGoal = 'develop',
): P {
  return {
    ...program,
    blocks: program.blocks.map((block) => ({
      ...block,
      weeks: block.weeks.map((w) => adaptWeek(w, level, daysPerWeek, goal)),
    })),
  }
}

/** Series semanales antes y después, para enseñar qué ha cambiado. */
export function volumeChange<P extends { blocks: Block[] }>(original: P, adapted: P, daysPerWeek: number) {
  const before = weeklySets(original.blocks[0].weeks[0], daysPerWeek)
  const after = weeklySets(adapted.blocks[0].weeks[0], daysPerWeek)
  const muscles = new Set([...Object.keys(before), ...Object.keys(after)]) as Set<MuscleId>
  return [...muscles]
    .map((m) => ({ muscle: m, before: before[m] ?? 0, after: after[m] ?? 0 }))
    .filter((x) => x.before !== x.after)
}
