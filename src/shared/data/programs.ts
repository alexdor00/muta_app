import type { Db } from './db.ts'

// Programas de entrenamiento: plantillas completas por bloques, semanas y sesiones.

export type ProgramExercise = {
  name: string
  /** Nombre tal como venía en el archivo original. */
  originalName?: string
  /** Tipo deducido: compuesto pesado, compuesto o aislamiento. */
  kind?: 'heavy' | 'compound' | 'isolation'
  /** Campos rellenados con las reglas de MUTA porque el original no los traía. */
  filled?: ('rpe' | 'rest')[]
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
const files = import.meta.glob<Program>(['/private/programs/*.json', '!/private/programs/_meta.json'], {
  import: 'default',
})
// Revisión de los programas locales: si cambia, se vuelven a cargar todos.
const meta = import.meta.glob<{ rev: number }>('/private/programs/_meta.json', {
  import: 'default',
  eager: true,
})
const LOCAL_REV = Object.values(meta)[0]?.rev ?? 0

export const LOCAL_PROGRAM_COUNT = Object.keys(files).length

/**
 * Guarda en la base de datos los programas que todavía no estén, o todos si cambió la revisión.
 * Devuelve cuántos ha guardado.
 */
export async function seedPrograms(db: Db): Promise<number> {
  const stored = (await db.get('meta', 'programsRev')) as { value: number } | undefined
  const outdated = (stored?.value ?? 0) !== LOCAL_REV
  const have = new Set(outdated ? [] : await db.getAllKeys('programs'))
  const missing = Object.entries(files).filter(
    ([path]) => !have.has(path.split('/').at(-1)!.replace('.json', '')),
  )
  if (outdated) await db.put('meta', { key: 'programsRev', value: LOCAL_REV })
  if (!missing.length) return 0
  const programs = await Promise.all(missing.map(([, load]) => load()))
  const tx = db.transaction('programs', 'readwrite')
  await Promise.all([...programs.map((program) => tx.store.put(program)), tx.done])
  return programs.length
}
