import { readAll, runTx, type Db } from '../db.ts'
import { SCHEMA_VERSION } from '../migrations/index.ts'
import { STORES, STORE_NAMES, type StoreName } from '../schema.ts'

export const BACKUP_FORMAT = 'muta-backup'
export const BACKUP_EVERY_DAYS = 14

export type Backup = {
  format: typeof BACKUP_FORMAT
  schemaVersion: number
  exportedAt: string
  stores: Partial<Record<StoreName, unknown[]>>
}

/** Todo lo guardado, en un objeto listo para escribir en un archivo JSON. */
export async function exportBackup(db: Db, now = new Date()): Promise<Backup> {
  const stores = await readAll(db)
  await db.put('meta', { key: 'lastBackupAt', value: now.toISOString() })
  return { format: BACKUP_FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), stores }
}

/** ¿Toca avisar de hacer copia? Cada 14 días, o si nunca se ha hecho. */
export function needsBackupReminder(lastBackupAt: string | null, now = new Date()): boolean {
  if (!lastBackupAt) return true
  const days = (now.getTime() - new Date(lastBackupAt).getTime()) / 86_400_000
  return days >= BACKUP_EVERY_DAYS
}

export class BackupError extends Error {}

function hasKey(row: unknown, keyPath: string | string[]): boolean {
  if (typeof row !== 'object' || row === null) return false
  const keys = Array.isArray(keyPath) ? keyPath : [keyPath]
  return keys.every((key) => {
    const value = (row as Record<string, unknown>)[key]
    return typeof value === 'string' || typeof value === 'number'
  })
}

/** Comprueba que un archivo es una copia de MUTA que se puede importar. Lanza BackupError si no. */
export function validateBackup(data: unknown): Backup {
  if (typeof data !== 'object' || data === null) throw new BackupError('El archivo no es una copia de MUTA.')
  const backup = data as Partial<Backup>
  if (backup.format !== BACKUP_FORMAT) throw new BackupError('El archivo no es una copia de MUTA.')
  if (typeof backup.schemaVersion !== 'number' || backup.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError(
      'La copia es de una versión más nueva de la app. Actualiza MUTA e inténtalo otra vez.',
    )
  }
  if (backup.schemaVersion < SCHEMA_VERSION) {
    // Cuando haya versión 2, aquí se migran los datos de la copia antes de importarlos.
    throw new BackupError('La copia es de una versión anterior que esta app todavía no sabe convertir.')
  }
  if (typeof backup.stores !== 'object' || backup.stores === null) {
    throw new BackupError('La copia está incompleta.')
  }
  for (const [name, rows] of Object.entries(backup.stores)) {
    if (!(name in STORES)) throw new BackupError(`La copia tiene datos desconocidos («${name}»).`)
    if (!Array.isArray(rows)) throw new BackupError(`La copia está dañada en «${name}».`)
    const keyPath = STORES[name as StoreName].keyPath
    if (!rows.every((row) => hasKey(row, keyPath)))
      throw new BackupError(`La copia está dañada en «${name}».`)
  }
  return backup as Backup
}

/**
 * Sustituye los datos por los de la copia. Valida primero y escribe todo en una sola transacción:
 * si algo falla, no se borra nada y todo queda como estaba.
 */
export async function importBackup(db: Db, data: unknown): Promise<void> {
  const backup = validateBackup(data)
  await runTx(db, STORE_NAMES, async (tx) => {
    for (const name of STORE_NAMES) {
      const store = tx.objectStore(name)
      await store.clear()
      for (const row of backup.stores[name] ?? []) await store.put(row)
    }
  })
}
