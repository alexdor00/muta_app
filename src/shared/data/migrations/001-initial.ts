import { STORES, STORE_NAMES } from '../schema.ts'
import type { Migration } from './index.ts'

/** Versión 1: todos los almacenes con sus índices. */
export const m001Initial: Migration = (db) => {
  for (const name of STORE_NAMES) {
    const def = STORES[name]
    const store = db.createObjectStore(name, { keyPath: def.keyPath })
    for (const [index, keyPath] of Object.entries(def.indexes ?? {})) {
      store.createIndex(index, keyPath)
    }
  }
}
