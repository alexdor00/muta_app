// Puntos débiles: algunas rutinas dejan huecos para que elijas un ejercicio según el músculo que más
// quieras mejorar. Hay dos formas, tal como las describen los documentos originales:
// - «table» (Culturismo): eliges UN músculo y, de su tabla, un ejercicio 1 y, si quieres, un ejercicio 2.
// - «pick» (Torso y pierna): eliges músculos (el programa recomienda 2 o 3) y un ejercicio de cada uno,
//   y los repartes entre los días que tienen hueco.
// Nada es obligatorio: lo que dejes sin elegir, el hueco se quita.

export type WeakOption = { en: string; es: string; note?: string }
export type WeakMuscle = {
  id: string
  label: string
  group?: 'upper' | 'lower'
  /** Si el músculo no lleva ejercicios extra, el consejo del propio programa. */
  advice: string | null
  e1: WeakOption[]
  e2: WeakOption[]
}
export type WeakTable =
  | { mode: 'table'; muscles: WeakMuscle[] }
  /** `min` y `max` son la recomendación del programa, no un límite. */
  | { mode: 'pick'; min: number; max: number; muscles: WeakMuscle[] }

export type WeakChoice =
  | { mode: 'table'; muscle: string; e1: string | null; e2: string | null }
  | {
      mode: 'pick'
      picks: { muscle: string; option: string }[]
      /** Músculos de cada día con hueco (varios se alternan por semana). Sin decidir, se reparte solo. */
      slots?: Record<string, string[]>
    }

/** Un día con hueco de punto débil y de qué lado es. */
export type WeakSlot = { key: string; side: 'upper' | 'lower' }

type Exercise = {
  name: string
  originalName?: string
  notes?: string | null
  substitutions?: string[]
  [key: string]: unknown
}
type Day = { name: string; exercises: Exercise[] } | { rest: true }
type Week = { week: number; days: Day[] }
type Program = { blocks: { title: string | null; weeks: Week[] }[]; weakPoints?: WeakTable }

const TABLE_ROW = /^Weak Point Exercise ([12])\b/i
const PICK_ROW = /^(UPPER|LOWER) BODY WEAK POINT\b/i

const nameOf = (e: Exercise) => String(e.originalName ?? e.name)
const rowsOf = (program: Program) =>
  program.blocks.flatMap((b) =>
    b.weeks.flatMap((w) => w.days.flatMap((d) => ('exercises' in d ? d.exercises : []))),
  )

/** ¿Tiene huecos de punto débil? */
export const hasWeakPoints = (program: Program): program is Program & { weakPoints: WeakTable } =>
  !!program.weakPoints && rowsOf(program).some((e) => TABLE_ROW.test(nameOf(e)) || PICK_ROW.test(nameOf(e)))

/** Los días con hueco de «elige tus músculos», en orden. */
export function slotsOf(program: Program): WeakSlot[] {
  const out = new Map<string, WeakSlot>()
  for (const block of program.blocks)
    for (const week of block.weeks)
      for (const day of week.days) {
        if (!('exercises' in day)) continue
        const side = day.exercises
          .map(nameOf)
          .find((n) => PICK_ROW.test(n))
          ?.match(PICK_ROW)?.[1]
        if (side && !out.has(day.name))
          out.set(day.name, { key: day.name, side: side.toLowerCase() as 'upper' | 'lower' })
      }
  return [...out.values()]
}

const muscleOf = (table: WeakTable, id: string) => table.muscles.find((m) => m.id === id)
const optionOf = (list: WeakOption[], en: string | null) => (en ? list.find((o) => o.en === en) : undefined)

/**
 * Reparto automático de tus músculos entre los días con hueco: los de torso por orden en los días de
 * torso y los de pierna en los de pierna. Con más músculos que días, los sobrantes se alternan por
 * semana; con menos, se repiten.
 */
export function autoSlots(
  table: WeakTable,
  picks: { muscle: string }[],
  slots: WeakSlot[],
): Record<string, string[]> {
  const out: Record<string, string[]> = Object.fromEntries(slots.map((s) => [s.key, []]))
  for (const side of ['upper', 'lower'] as const) {
    const mine = slots.filter((s) => s.side === side)
    const ids = picks.filter((p) => muscleOf(table, p.muscle)?.group === side).map((p) => p.muscle)
    if (!mine.length || !ids.length) continue
    if (ids.length < mine.length) mine.forEach((s, i) => out[s.key].push(ids[i % ids.length]))
    else ids.forEach((id, j) => out[mine[j % mine.length].key].push(id))
  }
  return out
}

const swap = (e: Exercise, o: WeakOption): Exercise => ({
  ...e,
  name: o.es,
  originalName: o.en,
  substitutions: [],
  notes: o.note ?? null,
  kind: 'isolation',
})

/**
 * La rutina con la elección puesta en los huecos. Sin elegir, los huecos se quedan como están.
 * Un hueco sin ejercicio elegido desaparece.
 */
export function applyWeakPoints(program: Program, table: WeakTable, choice: WeakChoice | null): Program {
  if (!choice || choice.mode !== table.mode) return program
  const slots =
    choice.mode === 'pick' ? (choice.slots ?? autoSlots(table, choice.picks, slotsOf(program))) : {}
  let weekIndex = -1
  return {
    ...program,
    blocks: program.blocks.map((block) => ({
      ...block,
      weeks: block.weeks.map((week) => {
        weekIndex++
        return {
          ...week,
          days: week.days.map((day): Day => {
            if (!('exercises' in day)) return day
            const out: Exercise[] = []
            for (const e of day.exercises) {
              const name = nameOf(e)
              if (table.mode === 'table' && choice.mode === 'table') {
                const slot = name.match(TABLE_ROW)?.[1]
                if (!slot) {
                  out.push(e)
                  continue
                }
                const m = muscleOf(table, choice.muscle)
                const o = m && optionOf(slot === '1' ? m.e1 : m.e2, slot === '1' ? choice.e1 : choice.e2)
                if (o) out.push(swap(e, o))
                else if (!m) out.push(e) // músculo desconocido: se deja el hueco
                // sin ejercicio (sin elegir o solo consejo): el hueco se quita
                continue
              }
              if (!PICK_ROW.test(name) || choice.mode !== 'pick') {
                out.push(e)
                continue
              }
              const ids = slots[day.name] ?? []
              const id = ids.length ? ids[weekIndex % ids.length] : null
              const pick = id ? choice.picks.find((p) => p.muscle === id) : undefined
              const m = pick && muscleOf(table, pick.muscle)
              const o = m && optionOf(m.e1, pick!.option)
              if (o) out.push(swap(e, o))
              // sin músculo ese día: el hueco se quita
            }
            return { ...day, exercises: out }
          }),
        }
      }),
    })),
  }
}
