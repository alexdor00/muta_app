import type { Day, Exercise, ProgramData } from './program.ts'
import type { Slot } from './slots.ts'

// Puntos débiles: algunas rutinas dejan huecos para que elijas un ejercicio según el músculo que más
// quieras mejorar. Hay dos formas, tal como las describen los documentos originales:
// - «table» (Culturismo): eliges UN músculo y, de su tabla, un ejercicio 1 y, si quieres, un ejercicio 2.
// - «pick» (Torso y pierna): eliges, día a día, un músculo y un ejercicio suyo (el programa recomienda
//   2 o 3 músculos, siempre los mismos).
// Cada hueco se ve en la rutina con un tono suave y, al pulsarlo, se despliega con las opciones.
// Nada es obligatorio: un hueco sin elegir se queda como «a elegir» y no cuenta al entrenar.

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

/** Un programa con su tabla de puntos débiles. */
type Program = ProgramData & { weakPoints?: WeakTable }

export type WeakChoice =
  | { mode: 'table'; muscle: string; e1: string | null; e2: string | null }
  /** Un músculo y su ejercicio por día con hueco (clave: nombre del día, p. ej. «Torso 1»). */
  | { mode: 'pick'; slots: Record<string, { muscle: string; option: string } | null> }

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

export const muscleOf = (table: WeakTable, id: string) => table.muscles.find((m) => m.id === id)
const optionOf = (list: WeakOption[], en: string | null | undefined) =>
  en ? list.find((o) => o.en === en) : undefined

const filled = (e: Exercise, o: WeakOption, slot: Slot): Exercise => ({
  ...e,
  name: o.es,
  originalName: o.en,
  substitutions: [],
  notes: o.note ?? null,
  kind: 'isolation',
  slot,
})

/**
 * La rutina con la elección puesta en los huecos. Cada hueco queda marcado (`slot`) y, si no hay
 * elección para él, se queda tal cual («a elegir»): no se borra, para poder elegir cuando quieras.
 */
export function applyWeakPoints(program: Program, table: WeakTable, choice: WeakChoice | null): Program {
  const mine = choice?.mode === table.mode ? choice : null
  return {
    ...program,
    blocks: program.blocks.map((block) => ({
      ...block,
      weeks: block.weeks.map((week) => ({
        ...week,
        days: week.days.map((day): Day => {
          if (!('exercises' in day)) return day
          return {
            ...day,
            exercises: day.exercises.map((e): Exercise => {
              const name = nameOf(e)
              const which = name.match(TABLE_ROW)?.[1]
              if (which && table.mode === 'table') {
                const slot: Slot = { kind: 'weak', which: which === '1' ? 1 : 2, filled: false }
                const c = mine?.mode === 'table' ? mine : null
                const m = c && muscleOf(table, c.muscle)
                const o = m && optionOf(which === '1' ? m.e1 : m.e2, which === '1' ? c.e1 : c.e2)
                return o ? filled(e, o, { ...slot, filled: true }) : { ...e, slot }
              }
              if (PICK_ROW.test(name) && table.mode === 'pick') {
                const slot: Slot = { kind: 'pick', day: day.name, filled: false }
                const c = mine?.mode === 'pick' ? mine.slots[day.name] : null
                const m = c && muscleOf(table, c.muscle)
                const o = m && optionOf(m.e1, c.option)
                return o ? filled(e, o, { ...slot, filled: true }) : { ...e, slot }
              }
              return e
            }),
          }
        }),
      })),
    })),
  }
}

/** Quita los huecos sin elegir (para entrenar: lo que no elegiste no cuenta). */
export function dropEmptyHoles<P extends { blocks: { weeks: { days: unknown[] }[] }[] }>(program: P): P {
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
            exercises: day.exercises.filter(
              (e) => !((e.slot?.kind === 'weak' || e.slot?.kind === 'pick') && !e.slot.filled),
            ),
          }
        }),
      })),
    })),
  }
}
