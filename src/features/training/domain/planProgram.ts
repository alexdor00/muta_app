import type { Level } from './catalog.ts'
import { applyMarkedOptionals } from './optionals.ts'
import { applyPriorities, hasPriorities, type PriorityChoice } from './priorities.ts'
import type { ProgramData } from './program.ts'
import { applyWeakPoints, hasWeakPoints, type WeakChoice, type WeakTable } from './weakPoints.ts'

type Program = ProgramData & { weakPoints?: WeakTable }

/** Lo que eliges en una rutina (se guarda en el plan). */
export type PlanChoices = { weakPoints: WeakChoice | null; priorities: PriorityChoice | null }

/**
 * El programa con tus elecciones, en el orden fijo de la rutina: prioridades (quitan opcionales), punto débil y, en
 * las rutinas sin prioridades, los opcionales marcados. El original no se toca.
 */
export function applyChoices<P extends Program>(program: P, choices: PlanChoices, level: Level): P {
  const canPrioritize = hasPriorities(program)
  let shown: P = canPrioritize ? applyPriorities(program, choices.priorities, level) : program
  if (hasWeakPoints(program)) shown = applyWeakPoints(shown, program.weakPoints, choices.weakPoints) as P
  if (!canPrioritize) shown = applyMarkedOptionals(shown, choices.priorities)
  return shown
}
