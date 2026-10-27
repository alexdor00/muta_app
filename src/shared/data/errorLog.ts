import type { LoggedError } from '../lib/logger.ts'
import type { Db } from './db.ts'

const MAX_ERRORS = 200

/** Guarda un error en meta para exportarlo con la copia. Se quedan los últimos 200. */
export async function saveError(db: Db, entry: LoggedError): Promise<void> {
  const tx = db.transaction('meta', 'readwrite')
  const row = (await tx.store.get('errors')) as { key: string; value: LoggedError[] } | undefined
  const errors = [...(row?.value ?? []), entry].slice(-MAX_ERRORS)
  await tx.store.put({ key: 'errors', value: errors })
  await tx.done
}

export async function readErrors(db: Db): Promise<LoggedError[]> {
  const row = (await db.get('meta', 'errors')) as { value: LoggedError[] } | undefined
  return row?.value ?? []
}
