import { getDb, runTx } from '../../../shared/data/db.ts'
import { CATALOG, sourceOf } from '../domain/catalog.ts'
import type { PriorityChoice } from '../domain/priorities.ts'
import type { WeakChoice } from '../domain/weakPoints.ts'
import { BUILT_IN } from './routineDetail.ts'

/**
 * Guarda la rutina elegida como plan actual, con su variante y, si se pidió, la adaptación
 * («Adaptar a mí»: nivel y objetivo) y el punto débil elegido. El programa original no se toca.
 */
export async function chooseRoutine(
  programId: string,
  choices: { weakPoints?: WeakChoice | null; priorities?: PriorityChoice | null } = {},
  now = new Date(),
): Promise<void> {
  const entry = CATALOG.find((e) => e.id === programId)
  const source = entry ? sourceOf(entry) : programId
  const db = await getDb()
  await runTx(db, ['programs', 'plans'], async (tx) => {
    const builtIn = BUILT_IN[source]
    if (builtIn) await tx.objectStore('programs').put(builtIn)
    // Si es la misma rutina, se conservan los descansos, músculos, ejercicios cambiados, ediciones y descansos obligatorios
    // que ya elegiste
    const antes = (await tx.objectStore('plans').get('current')) as
      | {
          programId?: string
          descansos?: unknown
          musculos?: unknown
          cambios?: unknown
          ediciones?: unknown
          descansosTras?: unknown
        }
      | undefined
    const misma = antes?.programId === programId
    await tx.objectStore('plans').put({
      ...(misma
        ? {
            descansos: antes.descansos,
            musculos: antes.musculos,
            cambios: antes.cambios,
            ediciones: antes.ediciones,
            descansosTras: antes.descansosTras,
          }
        : {}),
      id: 'current',
      programId,
      source,
      variant: entry?.variant ?? null,
      adaptation: null,
      weakPoints: choices.weakPoints ?? null,
      priorities: choices.priorities ?? null,
      chosenAt: now.toISOString(),
    })
  })
}
