import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import measured from '../../../shared/content/program-levels.json'
import { phaseOf, type Goal } from '../../profile/index.ts'
import {
  recommend,
  type CatalogEntry,
  type Level,
  type MeasuredLevels,
  type MeasuredVolumes,
} from '../domain/catalog.ts'
import { routines } from '../state/routines.ts'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const GOALS: Goal[] = ['gain_muscle', 'lose_fat', 'feel_better']

type Measured = { level: Level; volume: 'maintain' | 'develop'; cycle: { sessions: number; rests: number } }
const INFO = measured as Record<string, Measured>

/** Nivel y volumen medidos de cada rutina por sus series (scripts/program-levels.ts). */
const LEVEL_OF: MeasuredLevels = Object.fromEntries(Object.entries(INFO).map(([id, v]) => [id, v.level]))
const VOLUME_OF: MeasuredVolumes = Object.fromEntries(Object.entries(INFO).map(([id, v]) => [id, v.volume]))

/** Subtítulo con lo que hay que saber: volumen de mantenimiento y ciclos que no son de una semana. */
function describe(entry: CatalogEntry): CatalogEntry {
  const info = INFO[entry.id]
  if (!info) return entry
  const extra: string[] = []
  if (info.volume === 'maintain') extra.push('volumen de mantenimiento')
  if (info.cycle.sessions > Math.max(...entry.days)) extra.push(`ciclo de ${info.cycle.sessions} sesiones`)
  return extra.length ? { ...entry, subtitle: `${entry.subtitle} · ${extra.join(' · ')}` } : entry
}

/** Carga las rutinas recomendadas según el perfil (días por semana, nivel y objetivo). */
export async function loadRoutines(): Promise<void> {
  routines.value = { status: 'loading' }
  try {
    const db = await getDb()
    const stored = (await db.get('profile', 'me')) as
      { daysPerWeek?: number; level?: string; goal?: string } | undefined
    const profile =
      stored && typeof stored.daysPerWeek === 'number' && LEVELS.includes(stored.level as Level)
        ? { daysPerWeek: stored.daysPerWeek, level: stored.level as Level }
        : null
    const phase = GOALS.includes(stored?.goal as Goal) ? phaseOf(stored!.goal as Goal) : undefined
    const available = new Set((await db.getAllKeys('programs')).map(String))
    const plan = (await db.get('plans', 'current')) as { programId?: string } | undefined
    const rec = recommend(
      { ...(profile ?? { daysPerWeek: 3, level: 'beginner' }), phase },
      available,
      LEVEL_OF,
      VOLUME_OF,
    )
    routines.value = {
      status: 'ready',
      profile,
      recommended: rec.recommended.map(describe),
      alsoAllowed: rec.alsoAllowed.map(describe),
      others: rec.others.map(describe),
      adjusted: rec.adjusted,
      notice: rec.notice,
      currentId: plan?.programId ?? null,
    }
  } catch (error) {
    logError(error, 'cargar rutinas')
    routines.value = { status: 'error' }
  }
}
