import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import cuerpoCompleto from '../../../shared/content/programs/muta-cuerpo-completo-4d.json'
import ppl from '../../../shared/content/programs/muta-ppl-6d.json'
import { CATALOG, sourceOf } from '../domain/catalog.ts'
import { selectVariant, type ProgramData } from '../domain/programInfo.ts'
import { metaLines, phasesView } from '../domain/routineView.ts'
import {
  applyWeakPoints,
  hasWeakPoints,
  isComplete,
  weakNeeds,
  weakSummary,
  type WeakChoice,
  type WeakNeeds,
  type WeakTable,
} from '../domain/weakPoints.ts'
import { routineDetail, routines, type RoutineItem, type WeakView } from '../state/routines.ts'
import { INFO, loadRoutines } from './loadRoutines.ts'

/** Programas propios de MUTA: van en el código. */
export const BUILT_IN: Record<string, unknown> = { [cuerpoCompleto.id]: cuerpoCompleto, [ppl.id]: ppl }

type Program = ProgramData & { weakPoints?: WeakTable }
let open: { item: RoutineItem; program: Program; table: WeakTable | null; needs: WeakNeeds } | null = null

function show(choice: WeakChoice | null) {
  if (!open) return
  const { item, program, table, needs } = open
  const weak: WeakView | null = table
    ? {
        table,
        choice,
        needs,
        required: table.mode === 'pick' || !needs.e1Optional,
        complete: isComplete(table, choice, needs),
        summary: weakSummary(table, choice),
      }
    : null
  const shown = table ? applyWeakPoints(program as never, table, choice) : program
  routineDetail.value = { status: 'ready', item, phases: phasesView(shown as never), weak }
}

/** Abre una rutina: carga su programa (propio o local) y la enseña tal cual está diseñada. */
export async function openRoutine(id: string): Promise<void> {
  routineDetail.value = { status: 'loading' }
  open = null
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
    const db = await getDb()
    const raw = (BUILT_IN[source] ?? (await db.get('programs', source))) as Program | undefined
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
    const program = selectVariant(raw, entry.variant)
    open = {
      item,
      program,
      table: hasWeakPoints(program) ? program.weakPoints! : null,
      needs: weakNeeds(program),
    }
    // Si ya empezaste esta rutina, vuelve lo que elegiste
    const plan = await db.get('plans', 'current')
    const saved =
      plan?.programId === id ? ((plan as { weakPoints?: WeakChoice | null }).weakPoints ?? null) : null
    show(saved)
  } catch (error) {
    logError(error, 'abrir rutina')
    routineDetail.value = { status: 'missing' }
  }
}

/** Guarda lo que eliges en el selector de punto débil y recalcula lo que ves. */
export function setWeakPoints(choice: WeakChoice | null): void {
  show(choice)
}
