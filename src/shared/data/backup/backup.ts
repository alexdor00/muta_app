import { readAll, runTx, type Db } from '../db.ts'
import { SCHEMA_VERSION } from '../migrations/index.ts'
import { STORES, STORE_NAMES, type StoreName } from '../schema.ts'

export const BACKUP_FORMAT = 'muta-backup'
/** Cada cuánto se recuerda guardar la copia (usuario, 2026-11-24: cada mes) y, sin ninguna, a los cuántos días de empezar. */
export const BACKUP_EVERY_DAYS = 30
export const PRIMERA_COPIA_DIAS = 7

export type Backup = {
  format: typeof BACKUP_FORMAT
  schemaVersion: number
  exportedAt: string
  stores: Partial<Record<StoreName, unknown[]>>
}

/** Todo lo guardado, en un objeto listo para escribir en un archivo JSON. */
export async function exportBackup(db: Db, now = new Date()): Promise<Backup> {
  const stores = await readAll(db)
  return { format: BACKUP_FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), stores }
}

/** Apunta cuándo se guardó la última copia (solo si de verdad se guardó: compartir se puede cancelar). */
export async function marcarCopia(db: Db, now = new Date()): Promise<void> {
  await db.put('meta', { key: 'lastBackupAt', value: now.toISOString() })
}

const diasDesde = (iso: string, now: Date) => (now.getTime() - new Date(iso).getTime()) / 86_400_000

/**
 * ¿Toca recordar la copia? Cada mes desde la última; sin ninguna, a la semana de empezar a usar la app (`desde`). «Ahora
 * no» (`pospuesta`) la deja otro mes.
 */
export function needsBackupReminder(
  lastBackupAt: string | null,
  now = new Date(),
  desde: string | null = null,
  pospuesta: string | null = null,
): boolean {
  if (pospuesta && diasDesde(pospuesta, now) < BACKUP_EVERY_DAYS) return false
  if (lastBackupAt) return diasDesde(lastBackupAt, now) >= BACKUP_EVERY_DAYS
  return !desde || diasDesde(desde, now) >= PRIMERA_COPIA_DIAS
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
  // Una copia de una versión anterior vale (problema 13): las migraciones hasta hoy solo añaden almacenes, que quedan
  // vacíos. Si una migración cambia el formato de algo, aquí se convierte la copia antes de importarla.
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

/** Una foto (o cualquier archivo) dentro de la copia: su tipo y su contenido en base64. */
type BlobEnCopia = { __blob: string; base64: string }

const esBlobEnCopia = (x: unknown): x is BlobEnCopia =>
  typeof x === 'object' && x !== null && '__blob' in x && 'base64' in x

async function aBase64(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer())
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

/** Cambia cada foto (Blob) por su base64, en cualquier sitio de los datos (el JSON no sabe guardar archivos). */
async function sinBlobs(x: unknown): Promise<unknown> {
  if (x instanceof Blob) return { __blob: x.type, base64: await aBase64(x) }
  if (Array.isArray(x)) return Promise.all(x.map(sinBlobs))
  if (typeof x === 'object' && x !== null) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(x)) out[k] = await sinBlobs(v)
    return out
  }
  return x
}

/** Lo contrario de `sinBlobs`: el base64 vuelve a ser una foto. */
function conBlobs(x: unknown): unknown {
  if (esBlobEnCopia(x)) {
    const bin = atob(x.base64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new Blob([bytes], { type: x.__blob })
  }
  if (Array.isArray(x)) return x.map(conBlobs)
  if (typeof x === 'object' && x !== null)
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, conBlobs(v)]))
  return x
}

/** La copia en texto (JSON), con las fotos dentro. */
export async function copiaEnTexto(backup: Backup): Promise<string> {
  return JSON.stringify(await sinBlobs(backup))
}

/** Lee una copia de su texto: la comprueba y devuelve las fotos a su forma. Lanza BackupError si no vale. */
export function leerCopia(texto: string): Backup {
  let datos: unknown
  try {
    datos = JSON.parse(texto)
  } catch {
    throw new BackupError('El archivo no es una copia de MUTA.')
  }
  return conBlobs(validateBackup(datos)) as Backup
}

/** Lo que trae una copia, para enseñarlo antes de recuperarla. */
export function resumenCopia(b: Backup): { fecha: string; entrenos: number; dias: number; fotos: number } {
  const n = (s: StoreName, si: (x: Record<string, unknown>) => boolean = () => true) =>
    ((b.stores[s] ?? []) as Record<string, unknown>[]).filter(si).length
  return {
    fecha: b.exportedAt,
    entrenos: n('workouts', (x) => x.status === 'finished'),
    dias: n('foodLog'),
    fotos: n('photos'),
  }
}
