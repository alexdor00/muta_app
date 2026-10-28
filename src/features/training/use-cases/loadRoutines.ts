import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import levels from '../../../shared/content/program-levels.json'
import { recommend, type Level, type MeasuredLevels } from '../domain/catalog.ts'
import { routines } from '../state/routines.ts'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']

/** Nivel medido de cada rutina por sus series (scripts/program-levels.ts). */
const MEASURED: MeasuredLevels = Object.fromEntries(
  Object.entries(levels).map(([id, v]) => [id, (v as { level: Level }).level]),
)

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
    const rec = recommend(profile ?? { daysPerWeek: 3, level: 'beginner' }, available, MEASURED)
    routines.value = {
      status: 'ready',
      profile,
      recommended: rec.recommended,
      alsoAllowed: rec.alsoAllowed,
      others: rec.others,
      adjusted: rec.adjusted,
      notice: rec.notice,
      currentId: plan?.programId ?? null,
    }
  } catch (error) {
    logError(error, 'cargar rutinas')
    routines.value = { status: 'error' }
  }
}
