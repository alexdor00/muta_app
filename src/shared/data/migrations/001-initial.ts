import { STORES, STORES_ADDED_IN, STORE_NAMES } from '../schema.ts'
import type { Migration } from './index.ts'

const later = new Set(Object.values(STORES_ADDED_IN).flat())

/** Versión 1: todos los almacenes con sus índices (menos los que llegaron en versiones posteriores). */
export const m001Initial: Migration = (db) => {
  for (const name of STORE_NAMES) {
    if (later.has(name)) continue
    const def = STORES[name]
    const store = db.createObjectStore(name, { keyPath: def.keyPath })
    for (const [index, keyPath] of Object.entries(def.indexes ?? {})) {
      store.createIndex(index, keyPath)
    }
  }
}
