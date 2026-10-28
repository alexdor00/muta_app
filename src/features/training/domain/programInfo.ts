import { BIG, MUSCLES, type MuscleId } from './muscles.ts'
import { levelFromSets, representativeWeek, weeklySets, type SetsByMuscle } from './programLevel.ts'

// Hechos medibles de una rutina. La clasificación (categories.ts) sale de aquí, no de opiniones.

type Exercise = {
  name: string
  originalName?: string
  muscle?: string
  group?: string | null
  kind?: 'heavy' | 'compound' | 'isolation'
  sets: number | string | null
  warmupSets?: string | number | null
  rest?: string | null
  percent1RM?: string | null
}
type Day = { name: string; exercises: Exercise[] } | { rest: true; note?: string }
type Week = { week: number; days: Day[] }
type Block = { title: string | null; weeks: Week[] }
export type ProgramData = { blocks: Block[] }

/** Variante de un archivo con varias rutinas dentro (bloques y sesiones que le tocan). */
export type Variant = { blocks?: number[]; sessions?: string }

export function selectVariant<P extends ProgramData>(program: P, variant?: Variant): P {
  if (!variant) return program
  const sessions = variant.sessions ? new RegExp(variant.sessions, 'i') : null
  const blocks = (variant.blocks ?? program.blocks.map((_, i) => i))
    .map((i) => program.blocks[i])
    .filter(Boolean)
  return {
    ...program,
    blocks: blocks.map((block) => ({
      ...block,
      weeks: block.weeks.map((week) => ({
        ...week,
        days: sessions ? week.days.filter((d) => 'rest' in d || sessions.test(d.name)) : week.days,
      })),
    })),
  }
}

/** Una fila por grupo de progresión (en «En casa» las filas de un grupo son niveles del mismo ejercicio). */
const oncePerGroup = (exercises: Exercise[]) =>
  exercises.filter((e, i) => !e.group || exercises.findIndex((x) => x.group === e.group) === i)
const setsOf = (e: Exercise) =>
  typeof e.sets === 'number' ? e.sets : Number.parseInt(String(e.sets ?? ''), 10) || 0
const sessionsOf = (week: Week) =>
  week.days.filter((d): d is { name: string; exercises: Exercise[] } => 'exercises' in d)

/** Minutos de descanso de un texto («~2-3 min», «30sec», «3.0 min»); sin dato, por tipo de ejercicio. */
export function restMinutes(rest: string | null | undefined, kind?: Exercise['kind']): number {
  const fallback = kind === 'heavy' ? 3 : kind === 'isolation' ? 1.5 : 2.5
  if (!rest) return fallback
  const nums = [...rest.replace(',', '.').matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))
  if (!nums.length) return fallback
  const value = nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0]
  const minutes = /sec|seg|\bs\b/i.test(rest) && !/min/i.test(rest) ? value / 60 : value
  return Math.min(minutes, 5)
}

/** Series de aproximación que marca la rutina («2-3» → 2,5). */
const warmupsOf = (e: Exercise) => {
  const nums = [...String(e.warmupSets ?? '').matchAll(/\d+/g)].map((m) => Number(m[0]))
  return nums.length > 1 ? (nums[0] + nums[1]) / 2 : (nums[0] ?? 0)
}

/** Minutos por serie de aproximación (pocas repeticiones y poco descanso). */
export const WARMUP_SET_MINUTES = 1

/**
 * Duración de una sesión: la fórmula de docs/conocimiento (Σ series × (descanso + 45 s) + 8 min de
 * calentamiento general) más las series de aproximación que marca la propia rutina (1 min cada una).
 */
export function sessionMinutes(exercises: Exercise[]): number {
  return (
    oncePerGroup(exercises).reduce(
      (n, e) => n + setsOf(e) * (restMinutes(e.rest, e.kind) + 0.75) + warmupsOf(e) * WARMUP_SET_MINUTES,
      0,
    ) + 8
  )
}

/** Duración media de las sesiones de la semana representativa, redondeada a 5 minutos. */
export function programMinutes(program: ProgramData): number {
  const sessions = sessionsOf(representativeWeek(program as never) as Week)
  if (!sessions.length) return 0
  const avg = sessions.reduce((n, s) => n + sessionMinutes(s.exercises), 0) / sessions.length
  return Math.round(avg / 5) * 5
}

const allExercises = (program: ProgramData) =>
  program.blocks.flatMap((b) =>
    b.weeks.flatMap((w) => sessionsOf(w).flatMap((d) => oncePerGroup(d.exercises))),
  )

/** Parte de las series programadas por %1RM (fuerza). */
export function strengthShare(program: ProgramData): number {
  const all = allExercises(program)
  return all.length ? all.filter((e) => e.percent1RM && /\d/.test(e.percent1RM)).length / all.length : 0
}

/** Series medias por ejercicio (las rutinas minimalistas usan 1–2). */
export function setsPerExercise(program: ProgramData): number {
  const all = allExercises(program).filter((e) => setsOf(e) > 0)
  return all.length ? Math.round((all.reduce((n, e) => n + setsOf(e), 0) / all.length) * 100) / 100 : 0
}

/** Material de gimnasio, en inglés (archivos originales) y en español (rutinas de MUTA). */
const GYM =
  /BARBELL|MACHINE|CABLE|SMITH|LEG PRESS|PULLDOWN|LAT PULL|HACK|PEC DECK|T-BAR|EZ[- ]BAR|HEX BAR|TRAP BAR|LANDMINE|BENCH PRESS|PULL-?UP|CHIN-?UP|DIP\b|LEG EXTENSION|LEG CURL|ROPE|MÁQUINA|POLEA|BARRA|MULTIPOWER|PRENSA|JALÓN|PENDULAR|CONTRACTORA|PREDICADOR|DOMINADA|FONDOS|EXTENSIÓN DE CUÁDRICEPS|CURL FEMORAL|PRESS BANCA/
/** De casa aunque el nombre suene a gimnasio: curl deslizante con toalla, fitball, bandas. */
const HOME_OK = /BAND|SLIDING|SWISS BALL|STABILITY BALL|TOWEL|BANDA|FITBALL|DESLIZ/

/** Gimnasio o casa: en casa no hay barras, máquinas ni poleas (las bandas sí valen). */
export function equipmentOf(program: ProgramData): 'gym' | 'home' {
  const all = allExercises(program)
  const gym = all.filter((e) => {
    const name = (e.originalName ?? e.name).toUpperCase()
    return GYM.test(name) && !HOME_OK.test(name)
  }).length
  return all.length && gym / all.length < 0.05 ? 'home' : 'gym'
}

export type Split = 'cuerpo-completo' | 'torso-pierna' | 'ppl' | 'hibrido' | 'por-grupos'

export const SPLIT_LABEL: Record<Split, string> = {
  'cuerpo-completo': 'Cuerpo completo',
  'torso-pierna': 'Torso y pierna',
  ppl: 'Empuje, tirón y pierna',
  hibrido: 'Mixto',
  'por-grupos': 'Por grupos musculares',
}

const UPPER_WORDS = /pecho|espalda|dorsal|hombro|bíceps|tríceps|brazos/i
const LOWER_WORDS = /cuádriceps|isquio|femoral|glúteo|pierna|gemelo/i

/** Tipo de una sesión por su nombre. Las de MUTA se llaman por músculos («Cuádriceps y espalda»). */
function sessionType(name: string): 'fb' | 'push' | 'pull' | 'upper' | 'lower' | 'extra' | 'other' {
  if (/Cuerpo completo|^Sesión \d/i.test(name)) return 'fb'
  if (/Empuje/i.test(name)) return 'push'
  if (/Tirón/i.test(name)) return 'pull'
  if (/Brazos|Test/i.test(name)) return 'extra'
  if (UPPER_WORDS.test(name) && LOWER_WORDS.test(name)) return 'fb'
  if (/Torso/i.test(name) || UPPER_WORDS.test(name)) return 'upper'
  if (LOWER_WORDS.test(name)) return 'lower'
  return 'other'
}

/** Reparto según las sesiones de la semana representativa, con su nombre en lenguaje claro. */
export function splitOf(program: ProgramData): { split: Split; label: string } {
  const types = new Set(
    sessionsOf(representativeWeek(program as never) as Week).map((s) => sessionType(s.name)),
  )
  const has = (...t: string[]) => t.some((x) => types.has(x as never))
  const ppl = has('push', 'pull')
  if (ppl && has('upper')) return { split: 'hibrido', label: 'Empuje, tirón y pierna + torso y pierna' }
  if (ppl && has('fb')) return { split: 'hibrido', label: 'Empuje, tirón y pierna + cuerpo completo' }
  if (ppl) return { split: 'ppl', label: SPLIT_LABEL.ppl }
  if (has('fb') && has('upper', 'lower'))
    return { split: 'hibrido', label: 'Cuerpo completo + torso y pierna' }
  if (has('fb')) return { split: 'cuerpo-completo', label: SPLIT_LABEL['cuerpo-completo'] }
  if (has('upper', 'lower')) return { split: 'torso-pierna', label: SPLIT_LABEL['torso-pierna'] }
  return { split: 'por-grupos', label: SPLIT_LABEL['por-grupos'] }
}

export type VolumeTier = 'bajo' | 'medio' | 'alto'

/**
 * Volumen respecto a la tabla de docs/conocimiento: media, en los grupos grandes que trabaja
 * (sin contar los de énfasis), de series semanales ÷ punto medio de «desarrollar» intermedio.
 * < 0,7 bajo · hasta 1,15 medio · más alto.
 */
export function volumeTier(
  sets: SetsByMuscle,
  emphasis: MuscleId[] = [],
): { tier: VolumeTier; ratio: number } {
  const muscles = (Object.keys(sets) as MuscleId[]).filter(
    (m) => BIG.has(m) && !emphasis.includes(m) && sets[m]! > 0,
  )
  if (!muscles.length) return { tier: 'bajo', ratio: 0 }
  const ratio =
    muscles.reduce((n, m) => {
      const [min, max] = MUSCLES[m].develop
      return n + sets[m]! / ((min + max) / 2)
    }, 0) / muscles.length
  const rounded = Math.round(ratio * 100) / 100
  return { tier: rounded < 0.7 ? 'bajo' : rounded <= 1.15 ? 'medio' : 'alto', ratio: rounded }
}

/** Series por encima del máximo de «desarrollar» intermedio para que un músculo cuente como énfasis. */
export const EMPHASIS_MARGIN = 2

/**
 * Músculos que la rutina trabaja como prioridad (especialización): en prioridad en nivel intermedio
 * (máximo 4) y con un exceso claro sobre «desarrollar» (más de 2 series por encima de su máximo).
 */
export function emphasisOf(sets: SetsByMuscle): MuscleId[] {
  return levelFromSets(sets)
    .perMuscle.filter(
      (m) => m.priority.intermediate && m.sets > MUSCLES[m.muscle].develop[1] + EMPHASIS_MARGIN,
    )
    .map((m) => m.muscle)
}

export type Cycle = {
  sessions: number
  rests: number
  /** Más sesiones en el ciclo que días por semana: la rutina rota y no cae siempre el mismo día. */
  rotating: boolean
  /** Lo que dicen los descansos del archivo («1-2 días», «opcional»…). */
  restNotes: string[]
}

export function cycleOf(program: ProgramData, daysPerWeek: number): Cycle {
  const week = program.blocks[0].weeks[0]
  const rests = week.days.filter((d): d is { rest: true; note?: string } => 'rest' in d)
  const sessions = sessionsOf(week).length
  return {
    sessions,
    rests: rests.length,
    rotating: sessions > daysPerWeek,
    restNotes: [...new Set(rests.map((r) => r.note ?? '').filter(Boolean))],
  }
}

export type ProgramInfo = {
  sets: SetsByMuscle
  volume: VolumeTier
  volumeRatio: number
  emphasis: MuscleId[]
  minutes: number
  setsPerExercise: number
  strengthShare: number
  equipment: 'gym' | 'home'
  split: Split
  splitLabel: string
  /** Semanas del programa; 0 = plantilla que se repite sin fecha de fin. */
  weeks: number
  phases: string[]
  cycle: Cycle
}

/** Todos los hechos de una rutina (ya con su variante aplicada). */
export function infoOf(program: ProgramData, daysPerWeek: number): ProgramInfo {
  const sets = weeklySets(representativeWeek(program as never), daysPerWeek)
  const emphasis = emphasisOf(sets)
  const { tier, ratio } = volumeTier(sets, emphasis)
  const { split, label } = splitOf(program)
  const weeks = program.blocks.reduce((n, b) => n + b.weeks.length, 0)
  return {
    sets,
    volume: tier,
    volumeRatio: ratio,
    emphasis,
    minutes: programMinutes(program),
    setsPerExercise: setsPerExercise(program),
    strengthShare: Math.round(strengthShare(program) * 100) / 100,
    equipment: equipmentOf(program),
    split,
    splitLabel: label,
    weeks: weeks <= 1 ? 0 : weeks,
    phases: program.blocks.length > 1 ? program.blocks.map((b, i) => b.title ?? `Bloque ${i + 1}`) : [],
    cycle: cycleOf(program, daysPerWeek),
  }
}
