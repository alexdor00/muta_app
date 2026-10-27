import type { Db } from './db.ts'

// Programas de entrenamiento: plantillas completas por bloques, semanas y sesiones.

export type ProgramExercise = {
  name: string
  /** Grupo del ejercicio en programas por progresión (p. ej. «LUNGE» para «BRACED LUNGE»). */
  group?: string | null
  warmupSets: string | null
  sets: number | string | null
  reps: string | null
  rpe: string | null
  percent1RM: string | null
  rest: string | null
  technique: string | null
  substitutions: string[]
  notes: string | null
  progression?: string | null
}

export type ProgramDay = { name: string; exercises: ProgramExercise[] } | { rest: true; note: string }
export type ProgramWeek = { week: number; days: ProgramDay[] }
export type ProgramBlock = { title: string | null; weeks: ProgramWeek[] }
export type Program = { id: string; name: string; source: 'xlsx' | 'pdf'; blocks: ProgramBlock[] }

/**
 * Programas guardados en local (carpeta private/, fuera del repositorio).
 * Cada archivo se descarga aparte y solo cuando se cargan.
 */
const files = import.meta.glob<Program>('/private/programs/*.json', { import: 'default' })

export const LOCAL_PROGRAM_COUNT = Object.keys(files).length

/** Guarda en la base de datos los programas que todavía no estén. Devuelve cuántos ha añadido. */
export async function seedPrograms(db: Db): Promise<number> {
  const have = new Set(await db.getAllKeys('programs'))
  const missing = Object.entries(files).filter(
    ([path]) => !have.has(path.split('/').at(-1)!.replace('.json', '')),
  )
  if (!missing.length) return 0
  const programs = await Promise.all(missing.map(([, load]) => load()))
  const tx = db.transaction('programs', 'readwrite')
  await Promise.all([...programs.map((program) => tx.store.put(program)), tx.done])
  return programs.length
}
