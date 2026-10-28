import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import cuerpoCompleto from '../../../shared/content/programs/muta-cuerpo-completo-4d.json'
import ppl from '../../../shared/content/programs/muta-ppl-6d.json'
import type { SetsGoal } from '../domain/adaptVolume.ts'
import { CATALOG, sourceOf, type Phase } from '../domain/catalog.ts'
import { selectVariant, type ProgramData } from '../domain/programInfo.ts'
import { metaLines, routineView, type Adaptation } from '../domain/routineView.ts'
import { routineDetail, routines } from '../state/routines.ts'
import { INFO, loadRoutines } from './loadRoutines.ts'

/** Programas propios de MUTA: van en el código. */
export const BUILT_IN: Record<string, unknown> = { [cuerpoCompleto.id]: cuerpoCompleto, [ppl.id]: ppl }

let program: ProgramData | null = null
let days = 0

/** Objetivo de las series según la fase: definición y mantenimiento → mantener; volumen → ganar. */
export const goalForPhase = (phase: Phase | null): SetsGoal =>
  phase === 'bulk' || !phase ? 'develop' : 'maintain'

/** Abre una rutina: carga su programa (propio o local) y la enseña sin adaptar. */
export async function openRoutine(id: string): Promise<void> {
  routineDetail.value = { status: 'loading' }
  try {
    if (routines.value.status !== 'ready') await loadRoutines()
    const state = routines.value
    const entry = CATALOG.find((e) => e.id === id)
    const info = INFO[id]
    if (!entry || !info || state.status !== 'ready') {
      routineDetail.value = { status: 'missing' }
      return
    }
    const source = sourceOf(entry)
    const raw = (BUILT_IN[source] ?? (await (await getDb()).get('programs', source))) as
      ProgramData | undefined
    if (!raw) {
      routineDetail.value = { status: 'missing' }
      return
    }
    program = selectVariant(raw, entry.variant)
    days = Math.max(...entry.days)
    const item = state.items.find((i) => i.entry.id === id) ?? {
      entry,
      info,
      categories: info.categories,
      recommended: false,
      allowed: false,
      lines: metaLines(entry, info),
    }
    const suggested: Adaptation = {
      level: state.profile?.level ?? 'intermediate',
      goal: goalForPhase(state.profile?.phase ?? null),
    }
    routineDetail.value = {
      status: 'ready',
      item,
      adaptation: null,
      suggested,
      ...routineView(program as never, days, null),
    }
  } catch (error) {
    logError(error, 'abrir rutina')
    routineDetail.value = { status: 'missing' }
  }
}

/** «Adaptar a mí»: aplica (o quita, con null) el ajuste de nivel y objetivo. */
export function adaptRoutine(adaptation: Adaptation | null): void {
  const state = routineDetail.value
  if (state.status !== 'ready' || !program) return
  routineDetail.value = { ...state, adaptation, ...routineView(program as never, days, adaptation) }
}
