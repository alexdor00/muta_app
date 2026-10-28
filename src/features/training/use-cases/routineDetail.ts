import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import cuerpoCompleto from '../../../shared/content/programs/muta-cuerpo-completo-4d.json'
import ppl from '../../../shared/content/programs/muta-ppl-6d.json'
import { CATALOG, sourceOf } from '../domain/catalog.ts'
import { selectVariant, type ProgramData } from '../domain/programInfo.ts'
import { metaLines, phasesView } from '../domain/routineView.ts'
import { routineDetail, routines } from '../state/routines.ts'
import { INFO, loadRoutines } from './loadRoutines.ts'

/** Programas propios de MUTA: van en el código. */
export const BUILT_IN: Record<string, unknown> = { [cuerpoCompleto.id]: cuerpoCompleto, [ppl.id]: ppl }

/** Abre una rutina: carga su programa (propio o local) y la enseña tal cual está diseñada. */
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
    const item = state.items.find((i) => i.entry.id === id) ?? {
      entry,
      info,
      categories: info.categories,
      recommended: false,
      allowed: false,
      lines: metaLines(entry, info),
    }
    routineDetail.value = {
      status: 'ready',
      item,
      phases: phasesView(selectVariant(raw, entry.variant) as never),
    }
  } catch (error) {
    logError(error, 'abrir rutina')
    routineDetail.value = { status: 'missing' }
  }
}
