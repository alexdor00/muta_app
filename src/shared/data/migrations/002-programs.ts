import { STORES } from '../schema.ts'
import type { Migration } from './index.ts'

/** Versión 2: almacén de programas de entrenamiento. */
export const m002Programs: Migration = (db) => {
  db.createObjectStore('programs', { keyPath: STORES.programs.keyPath })
}
