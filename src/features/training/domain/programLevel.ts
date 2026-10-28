import type { Level } from './catalog.ts'
import { muscleOf } from './muscleOf.ts'
import { MUSCLE_IDS, rangeFor, type MuscleId } from './muscles.ts'

// Nivel de una rutina medido por sus series: series semanales directas por grupo muscular
// comparadas con los rangos «desarrollar» de cada nivel (docs/conocimiento).

export type SetsByMuscle = Partial<Record<MuscleId, number>>

type Exercise = {
  name: string
  originalName?: string
  muscle?: string
  group?: string | null
  sets: number | string | null
}
type Day = { exercises: Exercise[] } | { rest: true }
type Week = { week: number; days: Day[] }
type Program = { blocks: { weeks: Week[] }[] }

const sessionsOf = (week: Week) => week.days.filter((d) => 'exercises' in d && d.exercises.length).length

/**
 * Series directas por músculo en una semana del programa. Si la «semana» del archivo tiene
 * más sesiones que días por semana (ciclos de 8 sesiones en 6 días), se escala a una semana real.
 */
export function weeklySets(week: Week, daysPerWeek: number): SetsByMuscle {
  const sets: SetsByMuscle = {}
  for (const day of week.days) {
    if (!('exercises' in day)) continue
    // Programas por progresión: las filas de un mismo grupo son niveles del mismo ejercicio
    // (solo se hace uno), así que cada grupo cuenta una vez.
    const seenGroups = new Set<string>()
    for (const e of day.exercises) {
      if (e.group) {
        if (seenGroups.has(e.group)) continue
        seenGroups.add(e.group)
      }
      const muscle = muscleOf(e)
      const n = typeof e.sets === 'number' ? e.sets : Number.parseInt(String(e.sets ?? ''), 10)
      if (!muscle || !Number.isFinite(n) || n <= 0) continue
      sets[muscle] = (sets[muscle] ?? 0) + n
    }
  }
  const factor = Math.min(1, daysPerWeek / Math.max(1, sessionsOf(week)))
  for (const m of Object.keys(sets) as MuscleId[]) sets[m] = Math.round(sets[m]! * factor * 10) / 10
  return sets
}

/** Semana representativa: la mediana por series totales del primer bloque (evita semanas de introducción o descarga). */
export function representativeWeek(program: Program): Week {
  const weeks = [...program.blocks[0].weeks].sort((a, b) => totalSets(a) - totalSets(b))
  return weeks[Math.floor((weeks.length - 1) / 2)]
}

function totalSets(week: Week): number {
  return week.days.reduce(
    (n, d) =>
      n +
      ('exercises' in d ? d.exercises.reduce((m, e) => m + (typeof e.sets === 'number' ? e.sets : 0), 0) : 0),
    0,
  )
}

export type LevelFit = {
  level: Level
  /** Series que sobran o faltan respecto al rango de cada nivel, sumadas. */
  outside: Record<Level, number>
  perMuscle: {
    muscle: MuscleId
    sets: number
    /** Rango con el que se compara en cada nivel: desarrollar o prioridad, el más cercano. */
    ranges: Record<Level, [number, number]>
    /** En ese nivel, este músculo va como prioridad (especialización). */
    priority: Record<Level, boolean>
  }[]
}

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
/** Máximo de músculos en prioridad (docs/conocimiento, Parte II §2). */
export const MAX_PRIORITY = 4

const distance = (s: number, [min, max]: [number, number]) => (s < min ? min - s : s > max ? s - max : 0)

/**
 * Nivel que mejor encaja: el que deja menos series fuera de sus rangos (sumando lo que sobra o
 * falta en cada músculo trabajado). Cada músculo se compara con «desarrollar» o con «prioridad»,
 * el más cercano: así una especialización (p. ej. glúteo) no cuenta como exceso. Empate → el más bajo.
 */
export function levelFromSets(sets: SetsByMuscle): LevelFit {
  const trained = MUSCLE_IDS.filter((m) => (sets[m] ?? 0) > 0)
  // En cada nivel, como mucho 4 músculos en prioridad (docs/conocimiento): los que más se
  // pasan de «desarrollar», y solo si con «prioridad» quedan más cerca.
  const priorityFor = Object.fromEntries(
    LEVELS.map((level) => {
      const excess = trained
        .map((m) => {
          const s = sets[m]!
          const dev = rangeFor(m, level, 'develop')
          return {
            m,
            over: s - dev[1],
            better: distance(s, rangeFor(m, level, 'priority')) < distance(s, dev),
          }
        })
        .filter((x) => x.over > 0 && x.better)
        .sort((a, b) => b.over - a.over)
        .slice(0, MAX_PRIORITY)
      return [level, new Set(excess.map((x) => x.m))]
    }),
  ) as Record<Level, Set<MuscleId>>
  const perMuscle = trained.map((muscle) => ({
    muscle,
    sets: sets[muscle]!,
    ranges: Object.fromEntries(
      LEVELS.map((l) => [l, rangeFor(muscle, l, priorityFor[l].has(muscle) ? 'priority' : 'develop')]),
    ) as Record<Level, [number, number]>,
    priority: Object.fromEntries(LEVELS.map((l) => [l, priorityFor[l].has(muscle)])) as Record<
      Level,
      boolean
    >,
  }))
  const outside = Object.fromEntries(
    LEVELS.map((level) => [
      level,
      Math.round(perMuscle.reduce((n, m) => n + distance(m.sets, m.ranges[level]), 0) * 10) / 10,
    ]),
  ) as Record<Level, number>
  const level = LEVELS.reduce((best, l) => (outside[l] < outside[best] ? l : best), 'beginner' as Level)
  return { level, outside, perMuscle }
}

/**
 * Series que quedan fuera de los rangos «mantener» (iguales para todos los niveles).
 * Si es menos que con «desarrollar» del mejor nivel, la rutina es de volumen de mantenimiento.
 */
export function outsideMaintain(sets: SetsByMuscle): number {
  return (
    Math.round(
      MUSCLE_IDS.filter((m) => (sets[m] ?? 0) > 0).reduce(
        (n, m) => n + distance(sets[m]!, rangeFor(m, 'intermediate', 'maintain')),
        0,
      ) * 10,
    ) / 10
  )
}

export type Volume = 'maintain' | 'develop'

/** Ciclo de la rutina: sesiones y descansos que trae el archivo (no tiene por qué ser una semana). */
export function cycleOf(program: Program): { sessions: number; rests: number } {
  const week = program.blocks[0].weeks[0]
  return { sessions: sessionsOf(week), rests: week.days.filter((d) => 'rest' in d).length }
}

export function programLevel(
  program: Program,
  daysPerWeek: number,
): LevelFit & { sets: SetsByMuscle; volume: Volume; outsideMaintain: number } {
  const sets = weeklySets(representativeWeek(program), daysPerWeek)
  const fit = levelFromSets(sets)
  const maintain = outsideMaintain(sets)
  return {
    ...fit,
    sets,
    outsideMaintain: maintain,
    volume: maintain < fit.outside[fit.level] ? 'maintain' : 'develop',
  }
}
