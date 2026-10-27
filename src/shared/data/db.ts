import { openDB, type IDBPDatabase, type IDBPTransaction } from 'idb'
import { MIGRATIONS, SCHEMA_VERSION } from './migrations/index.ts'
import { DB_NAME, STORE_NAMES, type StoreName } from './schema.ts'

export type Db = IDBPDatabase
export type Tx = IDBPTransaction<unknown, StoreName[], 'readwrite'>

const SNAPSHOTS_DB = 'muta-backups'
const KEEP_SNAPSHOTS = 3

/** Versión con la que está guardada la base de datos ahora (0 si no existe). */
async function storedVersion(name: string): Promise<number> {
  if (!('databases' in indexedDB)) return 0
  const all = await indexedDB.databases()
  return all.find((db) => db.name === name)?.version ?? 0
}

/** Lee todos los almacenes de una base de datos abierta. */
export async function readAll(db: Db): Promise<Record<string, unknown[]>> {
  const out: Record<string, unknown[]> = {}
  for (const name of db.objectStoreNames) out[name] = await db.getAll(name)
  return out
}

/** Copia automática antes de migrar, en una base aparte. Se guardan las últimas 3. */
async function snapshotBeforeMigration(name: string, version: number): Promise<void> {
  const old = await openDB(name, version)
  const stores = await readAll(old)
  old.close()

  const snapshots = await openDB(SNAPSHOTS_DB, 1, {
    upgrade(db) {
      db.createObjectStore('snapshots', { keyPath: 'createdAt' })
    },
  })
  await snapshots.put('snapshots', {
    createdAt: new Date().toISOString(),
    db: name,
    schemaVersion: version,
    stores,
  })
  const keys = await snapshots.getAllKeys('snapshots')
  for (const key of keys.slice(0, Math.max(0, keys.length - KEEP_SNAPSHOTS))) {
    await snapshots.delete('snapshots', key)
  }
  snapshots.close()
}

/** Abre la base de datos, con copia previa y migraciones si la versión guardada es anterior. */
export async function openDatabase(name = DB_NAME): Promise<Db> {
  const current = await storedVersion(name)
  if (current > 0 && current < SCHEMA_VERSION) await snapshotBeforeMigration(name, current)

  const db = await openDB(name, SCHEMA_VERSION, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      for (let version = oldVersion; version < SCHEMA_VERSION; version++) {
        MIGRATIONS[version](database, transaction as IDBPTransaction<unknown, string[], 'versionchange'>)
      }
    },
    // Otra pestaña abre una versión más nueva: se cierra esta para no bloquearla.
    blocking() {
      db.close()
    },
  })
  await db.put('meta', { key: 'schemaVersion', value: SCHEMA_VERSION })
  return db
}

let shared: Promise<Db> | null = null

/** La base de datos de la app, abierta una sola vez. */
export function getDb(): Promise<Db> {
  shared ??= openDatabase()
  return shared
}

/**
 * Escritura de varios datos a la vez: o se guarda todo o nada.
 * Dentro de `work` solo se espera a operaciones de esta transacción (sin fetch ni timers):
 * IndexedDB la cierra en cuanto deja de tener trabajo pendiente.
 */
export async function runTx<T>(db: Db, stores: StoreName[], work: (tx: Tx) => Promise<T>): Promise<T> {
  const tx = db.transaction(stores, 'readwrite') as Tx
  // Si se deshace, tx.done falla: el error ya lo lanza `work`, así que esta promesa no debe avisar sola.
  tx.done.catch(() => {})
  try {
    const result = await work(tx)
    await tx.done
    return result
  } catch (error) {
    try {
      tx.abort()
    } catch {
      // Ya estaba cerrada: IndexedDB la deshizo al fallar.
    }
    throw error
  }
}

export { STORE_NAMES }
