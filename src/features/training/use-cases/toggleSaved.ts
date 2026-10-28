import { getDb } from '../../../shared/data/db.ts'
import { routines } from '../state/routines.ts'
import { SAVED_PREFIX } from './loadRoutines.ts'

/** Guarda o quita una rutina de «Guardadas» (marcador de la fila). */
export async function toggleSaved(programId: string, now = new Date()): Promise<void> {
  const db = await getDb()
  const id = `${SAVED_PREFIX}${programId}`
  const row = (await db.get('userContent', id)) as { deletedAt: string | null } | undefined
  const at = now.toISOString()
  const wasSaved = row && row.deletedAt === null
  await db.put('userContent', {
    id,
    target: programId,
    type: 'saved-routine',
    createdAt: (row as { createdAt?: string } | undefined)?.createdAt ?? at,
    updatedAt: at,
    deletedAt: wasSaved ? at : null,
  })
  const state = routines.value
  if (state.status === 'ready') {
    const saved = new Set(state.saved)
    if (wasSaved) saved.delete(programId)
    else saved.add(programId)
    routines.value = { ...state, saved }
  }
}
