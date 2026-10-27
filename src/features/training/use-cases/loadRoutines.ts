import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { recommend, type Level } from '../domain/catalog.ts'
import { routines } from '../state/routines.ts'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']

/** Carga las rutinas recomendadas según el perfil (días por semana y nivel). */
export async function loadRoutines(): Promise<void> {
  routines.value = { status: 'loading' }
  try {
    const db = await getDb()
    const stored = (await db.get('profile', 'me')) as { daysPerWeek?: number; level?: string } | undefined
    const profile =
      stored && typeof stored.daysPerWeek === 'number' && LEVELS.includes(stored.level as Level)
        ? { daysPerWeek: stored.daysPerWeek, level: stored.level as Level }
        : null
    const available = new Set((await db.getAllKeys('programs')).map(String))
    const plan = (await db.get('plans', 'current')) as { programId?: string } | undefined
    const { recommended, others } = recommend(profile ?? { daysPerWeek: 3, level: 'beginner' }, available)
    routines.value = { status: 'ready', profile, recommended, others, currentId: plan?.programId ?? null }
  } catch (error) {
    logError(error, 'cargar rutinas')
    routines.value = { status: 'error' }
  }
}
