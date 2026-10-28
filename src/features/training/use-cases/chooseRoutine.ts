import { getDb, runTx } from '../../../shared/data/db.ts'
import type { Level } from '../domain/catalog.ts'
import cuerpoCompleto from '../../../shared/content/programs/muta-cuerpo-completo-4d.json'
import ppl from '../../../shared/content/programs/muta-ppl-6d.json'

/** Programas propios de MUTA: van en el código y se copian a la base de datos al elegirlos. */
const BUILT_IN: Record<string, unknown> = { [cuerpoCompleto.id]: cuerpoCompleto, [ppl.id]: ppl }

/**
 * Guarda la rutina elegida como plan actual. Con adaptTo, el plan se usa adaptado a ese nivel
 * músculo a músculo (domain/adaptVolume.ts); el programa original no se toca.
 */
export async function chooseRoutine(
  programId: string,
  adaptTo: Level | null = null,
  now = new Date(),
): Promise<void> {
  const db = await getDb()
  await runTx(db, ['programs', 'plans'], async (tx) => {
    const builtIn = BUILT_IN[programId]
    if (builtIn) await tx.objectStore('programs').put(builtIn)
    await tx.objectStore('plans').put({ id: 'current', programId, adaptTo, chosenAt: now.toISOString() })
  })
}
