import type { Level } from './catalog.ts'

// Prioridades de las rutinas de MUTA: tienen ejercicios opcionales (huecos «opc») que dependen de lo
// que quieras mejorar (docs/conocimiento, reglas del generador):
// - Hombro anterior directo: solo si es prioridad.
// - Hombro posterior: se quita a principiantes salvo prioridad.
// - Los demás opcionales (aductores, cuádriceps o glúteo extra): se incluyen, y puedes quitarlos.
// - Máximo 4 músculos en prioridad.
// Todo es opcional: sin elegir nada se aplican las reglas por defecto.

export const MAX_PRIORITIES = 4

export type PriorityChoice = {
  /** Músculos prioritarios (como se llaman en la rutina). */
  priorities: string[]
  /** Lo que has decidido a mano de cada opcional; el resto sigue las reglas. */
  optionals: Record<string, boolean>
}

export type OptionalExercise = { key: string; name: string; muscle: string; days: string[] }

type Exercise = { name: string; muscle?: string; optional?: boolean }
type Day = { name: string; exercises: Exercise[] } | { rest: true }
type Program = { blocks: { weeks: { days: Day[] }[] }[] }

const rows = (program: Program) =>
  program.blocks.flatMap((b) =>
    b.weeks.flatMap((w) =>
      w.days.flatMap((d) => ('exercises' in d ? d.exercises.map((e) => ({ e, day: d.name })) : [])),
    ),
  )

/** Los ejercicios opcionales distintos de la rutina (uno por nombre y músculo). */
export function optionalsOf(program: Program): OptionalExercise[] {
  const out = new Map<string, OptionalExercise>()
  for (const { e, day } of rows(program)) {
    if (!e.optional || !e.muscle) continue
    const key = `${e.muscle}|${e.name}`
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

/** La rutina con tus prioridades: sin los opcionales que no entran. */
export function applyPriorities<P extends Program>(
  program: P,
  choice: PriorityChoice | null,
  level: Level,
): P {
  const skip = new Set(
    optionalsOf(program)
      .filter((o) => !isIncluded(o, choice, level))
      .map((o) => o.key),
  )
  if (!skip.size) return program
  return {
    ...program,
    blocks: program.blocks.map((block) => ({
      ...block,
      weeks: block.weeks.map((week) => ({
        ...week,
        days: week.days.map((day): Day =>
          'exercises' in day
            ? {
                ...day,
                exercises: day.exercises.filter((e) => !(e.optional && skip.has(`${e.muscle}|${e.name}`))),
              }
            : day,
        ),
      })),
    })),
  }
}

/** Líneas para resumir lo elegido. */
export function prioritySummary(choice: PriorityChoice | null): string[] {
  if (!choice) return []
  const lines: string[] = []
  if (choice.priorities.length) lines.push(`Prioridad: ${choice.priorities.join(', ')}`)
  const on = Object.values(choice.optionals).filter(Boolean).length
  const off = Object.values(choice.optionals).filter((v) => !v).length
  if (on || off) lines.push(`Opcionales a tu gusto: ${on} añadidos · ${off} quitados`)
  return lines
}
