import { getDb, runTx } from '../../../shared/data/db.ts'
import cuerpoCompleto from '../../../shared/content/programs/muta-cuerpo-completo-4d.json'
import ppl from '../../../shared/content/programs/muta-ppl-6d.json'

/** Programas propios de MUTA: van en el código y se copian a la base de datos al elegirlos. */
const BUILT_IN: Record<string, unknown> = { [cuerpoCompleto.id]: cuerpoCompleto, [ppl.id]: ppl }

/** Guarda la rutina elegida como plan actual. */
export async function chooseRoutine(programId: string, now = new Date()): Promise<void> {
  const db = await getDb()
  await runTx(db, ['programs', 'plans'], async (tx) => {
    const builtIn = BUILT_IN[programId]
    if (builtIn) await tx.objectStore('programs').put(builtIn)
    await tx.objectStore('plans').put({ id: 'current', programId, chosenAt: now.toISOString() })
  })
}
