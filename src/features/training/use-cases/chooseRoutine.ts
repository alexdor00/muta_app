import { getDb, runTx } from '../../../shared/data/db.ts'
import { CATALOG, sourceOf } from '../domain/catalog.ts'
import type { PriorityChoice } from '../domain/priorities.ts'
import type { SwapChoice } from '../domain/swaps.ts'
import type { WeakChoice } from '../domain/weakPoints.ts'
import { BUILT_IN } from './routineDetail.ts'

/**
 * Guarda la rutina elegida como plan actual, con su variante y, si se pidió, la adaptación
 * («Adaptar a mí»: nivel y objetivo) y el punto débil elegido. El programa original no se toca.
 */
export async function chooseRoutine(
  programId: string,
  choices: { weakPoints?: WeakChoice | null; priorities?: PriorityChoice | null; swaps?: SwapChoice } = {},
  now = new Date(),
): Promise<void> {
  const entry = CATALOG.find((e) => e.id === programId)
  const source = entry ? sourceOf(entry) : programId
  const db = await getDb()
  await runTx(db, ['programs', 'plans'], async (tx) => {
    const builtIn = BUILT_IN[source]
    if (builtIn) await tx.objectStore('programs').put(builtIn)
    await tx.objectStore('plans').put({
      id: 'current',
      programId,
      source,
      variant: entry?.variant ?? null,
      adaptation: null,
      weakPoints: choices.weakPoints ?? null,
      priorities: choices.priorities ?? null,
      swaps: choices.swaps ?? {},
      chosenAt: now.toISOString(),
    })
  })
}
