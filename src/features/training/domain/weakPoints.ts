// Puntos débiles: algunas rutinas dejan huecos para que elijas un ejercicio según el músculo que más
// quieras mejorar. Hay dos formas, tal como las describen los documentos originales:
// - «table» (Culturismo): eliges UN músculo y, de su tabla, un ejercicio 1 y, si quieres, un ejercicio 2.
// - «pick» (Torso y pierna): eliges 2 o 3 músculos y un ejercicio de cada uno, y los mantienes siempre.

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
  { mode: 'table'; muscles: WeakMuscle[] } | { mode: 'pick'; min: number; max: number; muscles: WeakMuscle[] }

export type WeakChoice =
  | { mode: 'table'; muscle: string; e1: string | null; e2: string | null }
  | { mode: 'pick'; picks: { muscle: string; option: string }[] }

/** Lo que hace falta elegir en esta rutina. */
export type WeakNeeds = { e1Optional: boolean }

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

const rowsOf = (program: Program) =>
  program.blocks.flatMap((b) =>
    b.weeks.flatMap((w) => w.days.flatMap((d) => ('exercises' in d ? d.exercises : []))),
  )
const nameOf = (e: Exercise) => String(e.originalName ?? e.name)

/** ¿Tiene huecos de punto débil? */
export const hasWeakPoints = (program: Program): program is Program & { weakPoints: WeakTable } =>
  !!program.weakPoints && rowsOf(program).some((e) => TABLE_ROW.test(nameOf(e)) || PICK_ROW.test(nameOf(e)))

/** El ejercicio 1 es opcional si la rutina lo marca así (fase 2 de Culturismo); el 2 siempre lo es. */
export function weakNeeds(program: Program): WeakNeeds {
  const first = rowsOf(program).filter((e) => /^Weak Point Exercise 1\b/i.test(nameOf(e)))
  return { e1Optional: first.length > 0 && first.every((e) => /\(optional\)/i.test(nameOf(e))) }
}

const muscleOf = (table: WeakTable, id: string) => table.muscles.find((m) => m.id === id)
const optionOf = (list: WeakOption[], en: string | null) => (en ? list.find((o) => o.en === en) : undefined)

/** ¿Está todo lo obligatorio elegido? */
export function isComplete(table: WeakTable, choice: WeakChoice | null, needs: WeakNeeds): boolean {
  if (!choice || choice.mode !== table.mode) return false
  if (table.mode === 'table' && choice.mode === 'table') {
    const m = muscleOf(table, choice.muscle)
    if (!m) return false
    if (m.e1.length === 0) return true // solo consejo: no hay ejercicio que elegir
    if (choice.e1 && !optionOf(m.e1, choice.e1)) return false
    if (choice.e2 && !optionOf(m.e2, choice.e2)) return false
    return needs.e1Optional || !!choice.e1
  }
  if (table.mode === 'pick' && choice.mode === 'pick') {
    const ids = choice.picks.map((p) => p.muscle)
    if (new Set(ids).size !== ids.length) return false
    if (ids.length < table.min || ids.length > table.max) return false
    const groups = choice.picks.map((p) => muscleOf(table, p.muscle))
    if (groups.some((m) => !m)) return false
    if (!groups.some((m) => m?.group === 'upper') || !groups.some((m) => m?.group === 'lower')) return false
    return choice.picks.every((p) => !!optionOf(muscleOf(table, p.muscle)!.e1, p.option))
  }
  return false
}

/** Líneas para resumir la elección («Hombros · Elevaciones laterales en máquina»). */
export function weakSummary(table: WeakTable, choice: WeakChoice | null): string[] {
  if (!choice || choice.mode !== table.mode) return []
  if (choice.mode === 'table') {
    const m = muscleOf(table, choice.muscle)
    if (!m) return []
    const names = [optionOf(m.e1, choice.e1), optionOf(m.e2, choice.e2)].filter(Boolean).map((o) => o!.es)
    return [names.length ? `${m.label} · ${names.join(' + ')}` : `${m.label} · sin ejercicio extra`]
  }
  return choice.picks.flatMap((p) => {
    const m = muscleOf(table, p.muscle)
    const o = m && optionOf(m.e1, p.option)
    return m && o ? [`${m.label} · ${o.es}`] : []
  })
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
 * Un hueco opcional que no se usa desaparece.
 */
export function applyWeakPoints(program: Program, table: WeakTable, choice: WeakChoice | null): Program {
  if (!choice || choice.mode !== table.mode) return program
  let weekIndex = -1
  return {
    ...program,
    blocks: program.blocks.map((block) => ({
      ...block,
      weeks: block.weeks.map((week) => {
        weekIndex++
        let upper = 0
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
                // sin ejercicio (opcional sin usar o solo consejo): el hueco se quita
                continue
              }
              const side = name.match(PICK_ROW)?.[1]?.toLowerCase()
              if (!side || choice.mode !== 'pick') {
                out.push(e)
                continue
              }
              const list = choice.picks.filter(
                (p) => muscleOf(table, p.muscle)?.group === (side === 'upper' ? 'upper' : 'lower'),
              )
              if (!list.length) {
                out.push(e)
                continue
              }
              const pick = side === 'upper' ? list[upper++ % list.length] : list[weekIndex % list.length]
              const o = optionOf(muscleOf(table, pick.muscle)!.e1, pick.option)
              out.push(o ? swap(e, o) : e)
            }
            return { ...day, exercises: out }
          }),
        }
      }),
    })),
  }
}
