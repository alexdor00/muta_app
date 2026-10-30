import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import programInfo from '../../../shared/content/program-info.json'
import { phaseOf, type Goal } from '../../profile/index.ts'
import { CATALOG, recommend, sourceOf, type Level } from '../domain/catalog.ts'
import { CATEGORIES, categoryOf, type FamilyId } from '../domain/categories.ts'
import type { ProgramInfo } from '../domain/programInfo.ts'
import { metaLines } from '../domain/routineView.ts'
import { routines, type RoutineItem } from '../state/routines.ts'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const GOALS: Goal[] = ['gain_muscle', 'lose_fat', 'feel_better']

/** Hechos y tipos medidos de cada rutina (scripts/program-info.ts). */
export const INFO = programInfo as unknown as Record<string, ProgramInfo & { categories: FamilyId[] }>

export const SAVED_PREFIX = 'guardada:'

/** Carga el catálogo: lo disponible, ordenado según tu perfil, con sus tipos y lo guardado. */
export async function loadRoutines(): Promise<void> {
  if (routines.value.status !== 'ready') routines.value = { status: 'loading' }
  try {
    const db = await getDb()
    const stored = (await db.get('profile', 'me')) as
      { daysPerWeek?: number; level?: string; goal?: string } | undefined
    const phase = GOALS.includes(stored?.goal as Goal) ? phaseOf(stored!.goal as Goal) : null
    const profile =
      stored && typeof stored.daysPerWeek === 'number' && LEVELS.includes(stored.level as Level)
        ? { daysPerWeek: stored.daysPerWeek, level: stored.level as Level, phase }
        : null
    const available = new Set((await db.getAllKeys('programs')).map(String))
    const plan = (await db.get('plans', 'current')) as { programId?: string } | undefined
    const savedRows = (await db.getAllFromIndex('userContent', 'target')) as {
      id: string
      target: string
      deletedAt: string | null
    }[]
    const saved = new Set(
      savedRows.filter((r) => r.id.startsWith(SAVED_PREFIX) && r.deletedAt === null).map((r) => r.target),
    )

    const rec = recommend(
      { ...(profile ?? { daysPerWeek: 3, level: 'beginner' as Level }), phase: phase ?? undefined },
      available,
      INFO,
    )
    const toItem =
      (recommended: boolean, allowed: boolean) =>
      (entry: (typeof CATALOG)[number]): RoutineItem | null => {
        const info = INFO[entry.id]
        return info
          ? {
              entry,
              info,
              categories: [categoryOf(entry.family)],
              recommended,
              allowed,
              lines: metaLines(entry, info),
            }
          : null
      }
    const items = [
      ...rec.recommended.map(toItem(true, true)),
      ...rec.alsoAllowed.map(toItem(false, true)),
      ...rec.others.map(toItem(false, false)),
    ].filter((x): x is RoutineItem => x !== null)

    routines.value = {
      status: 'ready',
      profile,
      notice: rec.notice,
      items,
      featured: items.find((i) => i.recommended) ?? null,
      categories: CATEGORIES.map((category) => {
        const inCat = items.filter((i) => i.categories.includes(category.id))
        return { category, count: inCat.length, forYou: inCat.filter((i) => i.recommended).length }
      }).filter((c) => c.count > 0),
      saved,
      currentId: plan?.programId ?? null,
    }
  } catch (error) {
    logError(error, 'cargar rutinas')
    routines.value = { status: 'error' }
  }
}

export { sourceOf }
