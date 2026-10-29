import type { Level } from './catalog.ts'
import { isSession, type Block, type Exercise as AdaptExercise, type Session, type Week } from './program.ts'
import { muscleOf } from './muscleOf.ts'
import { rangeFor, type MuscleId } from './muscles.ts'
import { emphasisOf } from './programInfo.ts'
import { levelFromSets, representativeWeek, weeklySets } from './programLevel.ts'

// Las rutinas se enseñan y se empiezan tal cual. Esto es para el coach: cuando tus datos lo pidan
// (estancado, sin recuperar), ajusta el volumen músculo a músculo (docs/conocimiento, Parte II §4):
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

const setsOf = (e: AdaptExercise) =>
  typeof e.sets === 'number' ? e.sets : Number.parseInt(String(e.sets ?? ''), 10)
const totalSets = (day: Session) => day.exercises.reduce((n, e) => n + (setsOf(e) || 0), 0)
const sessions = (week: Week) => week.days.filter(isSession)

function setSets(day: Session, target: AdaptExercise, n: number) {
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
    const counts = (day: Session, e: AdaptExercise) =>
      !e.group || day.exercises.find((x) => x.group === e.group) === e
    const candidates = () =>
      days.flatMap((day) =>
        day.exercises
          .filter(
            // Los básicos por %1RM siguen una periodización calculada: no se tocan.
            (e) =>
              counts(day, e) &&
              !e.percent1RM &&
              muscleOf(e) === muscle &&
              Number.isFinite(setsOf(e)) &&
              setsOf(e) > 0,
          )
          .map((e) => ({ day, e })),
      )
    const sessionSets = (day: Session) =>
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
      const subs = model.substitutions ?? []
      target.exercises.push({
        ...structuredClone(model),
        name: subs[0] ?? model.name,
        group: null,
        sets: NEW_EXERCISE_SETS,
        original: { sets: 0, rpe: null },
        added: true,
      })
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
    blocks: program.blocks.map((block) => {
      // El ajuste se calcula en la semana representativa de cada fase y se aplica igual a todas
      // sus semanas: así se conservan las olas de volumen (introducción, descarga, sobrecarga).
      const rep = representativeWeek({ blocks: [block] })
      const adaptedRep = adaptWeek(rep, level, daysPerWeek, goal)
      return { ...block, weeks: block.weeks.map((w) => applyLike(w, rep, adaptedRep)) }
    }),
  }
}

/** Aplica a una semana los mismos cambios que se hicieron en la semana modelo (mismo día y ejercicio). */
function applyLike(week: Week, model: Week, adapted: Week): Week {
  const out: Week = structuredClone(week)
  out.days.forEach((day, d) => {
    const before = model.days[d]
    const after = adapted.days[d]
    if (!isSession(day) || !before || !after || !isSession(before) || !isSession(after)) return
    before.exercises.forEach((orig, i) => {
      const next = after.exercises[i]
      const target = day.exercises[i]
      if (!next || !target || target.name !== orig.name) return
      const delta = setsOf(next) - setsOf(orig)
      if (delta !== 0 && Number.isFinite(setsOf(target))) {
        target.original ??= { sets: target.sets, rpe: target.rpe }
        target.sets = next.removed ? 0 : Math.max(1, setsOf(target) + delta)
        if (next.removed) target.removed = true
      }
      if (next.rpe !== orig.rpe && !target.percent1RM) {
        target.original ??= { sets: target.sets, rpe: target.rpe }
        target.rpe = next.rpe
      }
    })
    for (const extra of after.exercises.slice(before.exercises.length)) {
      if (extra.added) day.exercises.push(structuredClone(extra))
    }
  })
  return out
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
