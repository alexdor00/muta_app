import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import cuerpoCompleto from '../../../shared/content/programs/muta-cuerpo-completo-4d.json'
import ppl from '../../../shared/content/programs/muta-ppl-6d.json'
import { CATALOG, sourceOf, type Level } from '../domain/catalog.ts'
import {
  applyPriorities,
  hasPriorities,
  isIncluded,
  limitOf,
  MAX_PRIORITIES,
  musclesOf,
  optionalsOf,
  reasonOf,
  type PriorityChoice,
} from '../domain/priorities.ts'
import { selectVariant, type ProgramData } from '../domain/programInfo.ts'
import { metaLines, phasesView } from '../domain/routineView.ts'
import {
  applyWeakPoints,
  autoSlots,
  hasWeakPoints,
  slotsOf,
  type WeakChoice,
  type WeakTable,
} from '../domain/weakPoints.ts'
import {
  routineDetail,
  routines,
  type PriorityView,
  type RoutineItem,
  type WeakView,
} from '../state/routines.ts'
import { INFO, loadRoutines } from './loadRoutines.ts'

/** Programas propios de MUTA: van en el código. */
export const BUILT_IN: Record<string, unknown> = { [cuerpoCompleto.id]: cuerpoCompleto, [ppl.id]: ppl }

type Program = ProgramData & { weakPoints?: WeakTable }
let open: {
  item: RoutineItem
  program: Program
  table: WeakTable | null
  level: Level
  canPrioritize: boolean
} | null = null
let weakChoice: WeakChoice | null = null
let priorityChoice: PriorityChoice | null = null

/** Calcula lo que se ve con las elecciones de ahora: prioridades primero (quitan opcionales), luego el punto débil. */
function show() {
  if (!open) return
  const { item, program, table, level, canPrioritize } = open
  const slots = table ? slotsOf(program as never) : []
  const weak: WeakView | null = table
    ? {
        table,
        slots,
        auto: weakChoice?.mode === 'pick' ? autoSlots(table, weakChoice.picks, slots) : {},
        choice: weakChoice,
      }
    : null
  const afterPriorities: Program = canPrioritize
    ? applyPriorities(program as never, priorityChoice, level)
    : program
  // Opcionales que siguen en la rutina tras la regla de tiempo
  const present = new Set(canPrioritize ? optionalsOf(afterPriorities as never).map((o) => o.key) : [])
  const priorities: PriorityView | null = canPrioritize
    ? {
        muscles: musclesOf(program as never),
        optionals: optionalsOf(program as never).map((o) => {
          const included = isIncluded(o, priorityChoice, level)
          return { ...o, included, trimmed: included && !present.has(o.key), reason: reasonOf(o.muscle) }
        }),
        choice: priorityChoice,
        max: MAX_PRIORITIES,
        minutes: limitOf(priorityChoice),
      }
    : null
  let shown: Program = afterPriorities
  if (table) shown = applyWeakPoints(shown as never, table, weakChoice) as Program
  routineDetail.value = { status: 'ready', item, phases: phasesView(shown as never), weak, priorities }
}

/** Abre una rutina: carga su programa (propio o local) y la enseña tal cual está diseñada. */
export async function openRoutine(id: string): Promise<void> {
  routineDetail.value = { status: 'loading' }
  open = null
  weakChoice = null
  priorityChoice = null
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
      level: state.profile?.level ?? 'intermediate',
      canPrioritize: hasPriorities(program as never),
    }
    // Si ya empezaste esta rutina, vuelve lo que elegiste
    const plan = (await db.get('plans', 'current')) as
      { programId?: string; weakPoints?: WeakChoice | null; priorities?: PriorityChoice | null } | undefined
    if (plan?.programId === id) {
      weakChoice = plan.weakPoints ?? null
      priorityChoice = plan.priorities ?? null
    }
    show()
  } catch (error) {
    logError(error, 'abrir rutina')
    routineDetail.value = { status: 'missing' }
  }
}

/** Guarda lo que eliges en el selector de punto débil y recalcula lo que ves. */
export function setWeakPoints(choice: WeakChoice | null): void {
  weakChoice = choice
  show()
}

/** Guarda tus prioridades y los opcionales que decides a mano, y recalcula lo que ves. */
export function setPriorities(choice: PriorityChoice | null): void {
  priorityChoice = choice
  show()
}
