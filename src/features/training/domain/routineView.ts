import { aboutOf } from './about.ts'
import type { Slot } from './slots.ts'
import { adaptToLevel, type SetsGoal } from './adaptVolume.ts'
import type { CatalogEntry, Level } from './catalog.ts'
import { MUSCLES, type MuscleId } from './muscles.ts'
import { sessionMinutes, type ProgramInfo, type Split, type VolumeTier } from './programInfo.ts'
import { representativeWeek, weeklySets } from './programLevel.ts'

// Cómo se enseña una rutina: datos de la fila, filtros y detalle (con o sin adaptar).

const VOLUME_LABEL: Record<VolumeTier, string> = {
  bajo: 'Volumen bajo',
  medio: 'Volumen medio',
  alto: 'Volumen alto',
}

export const daysLabel = (days: number[]) =>
  days.length > 1 ? `${Math.min(...days)}–${Math.max(...days)} días` : `${days[0]} días`

/** Las dos líneas grises de una fila (como «Avanzado · Fuerza · Equipo completo» y «45 min»). */
export function metaLines(entry: CatalogEntry, info: ProgramInfo): [string, string] {
  const place = info.equipment === 'home' ? 'En casa' : 'Gimnasio'
  const length = info.phases.length
    ? `${info.phases.length} fases · ${info.weeks} semanas`
    : info.weeks
      ? `${info.weeks} semanas`
      : 'Sin fecha de fin'
  const rhythm = info.cycle.rotating ? `rota en ${info.cycle.sessions} sesiones` : daysLabel(entry.days)
  return [
    `${VOLUME_LABEL[info.volume]} · ${info.splitLabel} · ${place}`,
    `${rhythm} · ~${info.minutes} min · ${length}`,
  ]
}

// ── Filtros

export type Duration = 'corta' | 'media' | 'larga'
export type Filters = {
  days?: number
  split?: Split
  duration?: Duration
  volume?: VolumeTier
  cycle?: 'semanal' | 'rota'
  /** «si»: solo las que buscan mejorar los básicos. */
  basics?: 'si'
}

/** Corta ≤ 45 min · media 50–65 · larga ≥ 70. */
export function durationOf(minutes: number): Duration {
  return minutes <= 45 ? 'corta' : minutes <= 65 ? 'media' : 'larga'
}

export function matches(item: { entry: CatalogEntry; info: ProgramInfo }, f: Filters): boolean {
  const { entry, info } = item
  if (f.days && !entry.days.includes(f.days)) return false
  if (f.split && info.split !== f.split) return false
  if (f.duration && durationOf(info.minutes) !== f.duration) return false
  if (f.volume && info.volume !== f.volume) return false
  if (f.cycle && (f.cycle === 'rota') !== info.cycle.rotating) return false
  if (f.basics && !aboutOf(entry)?.basics) return false
  return true
}

export const activeFilters = (f: Filters) => Object.values(f).filter((v) => v !== undefined).length

// ── Detalle

export type Adaptation = { level: Level; goal: SetsGoal }

type Exercise = {
  name: string
  sets: number | string | null
  reps: string | null
  rpe: string | null
  percent1RM: string | null
  rest: string | null
  kind?: 'heavy' | 'compound' | 'isolation'
  group?: string | null
  original?: { sets: number | string | null; rpe: string | null }
  added?: boolean
  removed?: boolean
  muscle?: string
  originalName?: string
  slot?: Slot
  tip?: string
}
type Day = { name: string; exercises: Exercise[] } | { rest: true; note?: string }
type Week = { week: number; days: Day[] }
type Program = { blocks: { title: string | null; weeks: Week[] }[] }

export type ExerciseView = {
  name: string
  /** «3 × 8-10». */
  prescription: string
  /** «RIR 2» o «75 %». */
  effort: string | null
  rest: string | null
  status: 'same' | 'changed' | 'added' | 'removed'
  /** Lo que ponía la rutina original, si ha cambiado. */
  before: string | null
  /** Si se puede cambiar desde la rutina (se pinta con un tono suave y se despliega). */
  slot: Slot | null
  /** Indicación del documento para ese ejercicio (solo texto). */
  tip: string | null
}
export type DayView =
  | { type: 'session'; name: string; minutes: number; exercises: ExerciseView[] }
  | { type: 'rest'; note: string }
export type WeekView = { week: number; days: DayView[] }
export type PhaseView = { title: string | null; weeks: WeekView[] }

/**
 * El esfuerzo se enseña en RIR (repeticiones en reserva = 10 − RPE). Los programas guardan el RPE
 * original («8», «7-8», «~9-10»); un rango se invierte («7-8» → «RIR 2-3»). Sin número, tal cual.
 */
export function rirLabel(rpe: string): string {
  const nums = [...rpe.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')))
  if (!nums.length || nums.some((n) => n > 10)) return rpe
  const rir = [...new Set(nums.map((n) => Math.round((10 - n) * 10) / 10))].sort((a, b) => a - b)
  return `RIR ${rpe.trim().startsWith('~') ? '~' : ''}${rir.join('-')}`
}

function exerciseView(e: Exercise): ExerciseView {
  const off = e.slot?.kind === 'optional' && e.slot.off
  const status = e.removed || off ? 'removed' : e.added ? 'added' : e.original ? 'changed' : 'same'
  const effort = e.percent1RM ? e.percent1RM : e.rpe ? rirLabel(e.rpe) : null
  const before =
    status === 'changed' && e.original
      ? [
          e.original.sets !== e.sets ? `${e.original.sets} series` : null,
          e.original.rpe !== e.rpe && e.original.rpe ? rirLabel(e.original.rpe) : null,
        ]
          .filter(Boolean)
          .join(' · ') || null
      : null
  return {
    name: e.name,
    prescription: `${e.sets ?? '–'} × ${e.reps ?? '–'}`,
    effort,
    rest: e.rest,
    status: status === 'changed' && !before ? 'same' : status,
    before,
    slot: e.slot ?? null,
    tip: e.tip ?? null,
  }
}

/** Una fila por grupo de progresión: el primer nivel, con el resto como alternativas. */
const visible = (exercises: Exercise[]) =>
  exercises.filter((e, i) => !e.group || exercises.findIndex((x) => x.group === e.group) === i)

export function phasesView(program: Program): PhaseView[] {
  return program.blocks.map((block) => ({
    title: block.title,
    weeks: block.weeks.map((week) => ({
      week: week.week,
      days: week.days.map((d): DayView =>
        'rest' in d
          ? { type: 'rest', note: restNote(d.note) }
          : {
              type: 'session',
              name: d.name,
              minutes:
                Math.round(
                  sessionMinutes(
                    d.exercises.filter((e) => !(e.slot?.kind === 'optional' && e.slot.off)) as never,
                  ) / 5,
                ) * 5,
              exercises: visible(d.exercises).map(exerciseView),
            },
      ),
    })),
  }))
}

/**
 * Lo que dice el archivo, en lenguaje claro: «Obligatorio: 1-2 días de descanso» → «Descanso obligatorio · 1–2 días»;
 * «Sugerido: …» → «Descanso sugerido»; «Optional…» → «Descanso opcional».
 */
export function restNote(note?: string): string {
  if (!note) return 'Descanso'
  const kind = /optional|opcional/i.test(note)
    ? ' opcional'
    : /obligatorio/i.test(note)
      ? ' obligatorio'
      : /sugerido/i.test(note)
        ? ' sugerido'
        : ''
  const range = note.match(/(\d)\s*-\s*(\d)/)
  return `Descanso${kind}${range ? ` · ${range[1]}–${range[2]} días` : ''}`
}

export type VolumeChange = { muscle: string; before: number; after: number }

/** Series semanales por músculo antes y después de adaptar (semana representativa). */
export function volumeChanges(original: Program, adapted: Program, daysPerWeek: number): VolumeChange[] {
  const rep = representativeWeek(original as never)
  const index = original.blocks[0].weeks.indexOf(rep as never)
  const before = weeklySets(rep as never, daysPerWeek)
  const after = weeklySets(adapted.blocks[0].weeks[index] as never, daysPerWeek)
  return (Object.keys({ ...before, ...after }) as MuscleId[])
    .map((m) => ({ muscle: MUSCLES[m].label, before: before[m] ?? 0, after: after[m] ?? 0 }))
    .filter((c) => c.before !== c.after)
}

/** La rutina para enseñar: original, o adaptada a un nivel y objetivo («Adaptar a mí»). */
export function routineView(program: Program, daysPerWeek: number, adaptation: Adaptation | null) {
  if (!adaptation) return { phases: phasesView(program), changes: [] as VolumeChange[] }
  const adapted = adaptToLevel(program as never, adaptation.level, daysPerWeek, adaptation.goal) as Program
  return { phases: phasesView(adapted), changes: volumeChanges(program, adapted, daysPerWeek) }
}

/**
 * El dato «Descanso» de una rutina, para todas. Si el archivo trae días de descanso, se cuentan; si no, lo
 * dice. Solo «Empuje, tirón y pierna» de MUTA tiene el ciclo de 8 días que describe el documento de conocimiento.
 */
export function restFact(
  id: string,
  cycle: { sessions: number; rests: number; rotating: boolean },
  /** Lo que dice el documento original, si lo dice. */
  original?: string | null,
  /** Las sesiones de la primera semana, en orden. */
  sessions: string[] = [],
): string {
  if (original) return original
  if (cycle.rests > 0) {
    return cycle.rotating
      ? `${cycle.rests} de cada ${cycle.sessions + cycle.rests} días`
      : `${cycle.rests} ${cycle.rests === 1 ? 'día' : 'días'} por semana`
  }
  if (id === 'muta-ppl-6d') return 'Con ciclo de 8 días: 2 descansos (tras pierna A y tras pierna B)'
  // Costumbre: al acabar el ciclo completo, un día de descanso; las filas de la lista dicen dónde
  return sessions.length ? 'Sugerido: la rutina no los indica' : 'La rutina no los indica'
}

const REST_AFTER: Record<string, string[]> = {
  // El documento de conocimiento da el ejemplo «A1, B1, descanso, A2, B2, descanso»
  'muta-cuerpo-completo-4d': ['B1', 'B2'],
}

/**
 * Si la semana no trae días de descanso, se enseña el descanso sugerido: al acabar el ciclo completo (torso y
 * pierna, empuje-tirón-pierna…), o donde indique `REST_AFTER`. Si el archivo los trae, se dejan tal cual.
 */
export function withSuggestedRests(days: DayView[], id: string): DayView[] {
  if (days.some((d) => d.type === 'rest')) return days
  const rest: DayView = { type: 'rest', note: 'Descanso sugerido' }
  const after = REST_AFTER[id]
  if (!after) return days.some((d) => d.type === 'session') ? [...days, rest] : days
  return days.flatMap((d) =>
    d.type === 'session' && after.some((a) => d.name.startsWith(a)) ? [d, rest] : [d],
  )
}

/** ¿Las semanas de una fase son distintas entre sí (ejercicios, series…)? */
export function weeksDiffer(weeks: WeekView[]): boolean {
  const key = (w: WeekView) => JSON.stringify(w.days)
  return weeks.some((w) => key(w) !== key(weeks[0]))
}
