import type { PriorityChoice } from '../domain/priorities.ts'
import type { Slot } from '../domain/slots.ts'
import type { SlotPanelModel } from '../domain/slotPanel.ts'
import type { WeakChoice } from '../domain/weakPoints.ts'
import { routineDetail } from '../state/routines.ts'
import { setPriorities, setWeakPoints } from './routineDetail.ts'

const NO_PRIORITY: PriorityChoice = { priorities: [], optionals: {} }

/** El desplegable de una fila que se puede cambiar, con lo elegido hasta ahora; elegir en él recalcula la rutina. */
export function slotPanel(slot: Slot): SlotPanelModel | null {
  const state = routineDetail.value
  if (state.status !== 'ready') return null
  const { weak, priorities, choice } = state
  const prior = choice ?? NO_PRIORITY
  const setPrior = (change: Partial<PriorityChoice>) => setPriorities({ ...prior, ...change })

  if (slot.kind === 'optional') {
    const o = priorities?.optionals.find((x) => x.key === slot.key)
    return {
      kind: 'optional',
      muscle: o?.muscle ?? '',
      reason: o?.reason ?? null,
      why: slot.why,
      off: slot.off,
      minutes: priorities?.minutes ?? null,
      onSet: (include) => setPrior({ optionals: { ...prior.optionals, [slot.key]: include } }),
      original: o?.name ?? '',
      options: slot.options,
      value: slot.chosen,
      onPick: (name) => {
        const rest = Object.fromEntries(
          Object.entries(prior.alternatives ?? {}).filter(([key]) => key !== slot.key),
        )
        setPrior({ alternatives: name ? { ...rest, [slot.key]: name } : rest })
      },
    }
  }

  if (slot.kind === 'weak' && weak) {
    const now = weak.choice?.mode === 'table' ? weak.choice : null
    const put = (change: Partial<{ e1: string | null; e2: string | null }>) =>
      setWeakPoints({
        mode: 'table',
        muscle: now?.muscle ?? '',
        e1: now?.e1 ?? null,
        e2: now?.e2 ?? null,
        ...change,
      })
    return {
      kind: 'weak',
      which: slot.which,
      muscles: weak.table.muscles,
      muscle: now?.muscle ?? null,
      value: slot.which === 1 ? (now?.e1 ?? null) : (now?.e2 ?? null),
      onMuscle: (muscle) => setWeakPoints({ mode: 'table', muscle, e1: null, e2: null }),
      onOption: (en) => put(slot.which === 1 ? { e1: en } : { e2: en }),
    }
  }

  if (slot.kind === 'pick' && weak) {
    const slots = weak.choice?.mode === 'pick' ? weak.choice.slots : {}
    const mine = slots[slot.day] ?? null
    const set = (value: { muscle: string; option: string } | null): WeakChoice => ({
      mode: 'pick',
      slots: { ...slots, [slot.day]: value },
    })
    return {
      kind: 'pick',
      recommendation:
        weak.table.mode === 'pick'
          ? `El programa recomienda ${weak.table.min} o ${weak.table.max} músculos, siempre los mismos.`
          : '',
      muscles: weak.table.muscles,
      muscle: mine?.muscle ?? null,
      value: mine?.option || null,
      onMuscle: (muscle) => setWeakPoints(set({ muscle, option: '' })),
      onOption: (en) => setWeakPoints(set(en && mine ? { muscle: mine.muscle, option: en } : null)),
    }
  }
  return null
}
