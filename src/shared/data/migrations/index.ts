import type { IDBPDatabase, IDBPTransaction } from 'idb'
import { m001Initial } from './001-initial.ts'
import { m002Programs } from './002-programs.ts'

export type Migration = (db: IDBPDatabase, tx: IDBPTransaction<unknown, string[], 'versionchange'>) => void

/**
 * Migraciones en orden. La posición es la versión: MIGRATIONS[0] lleva a la 1, [1] a la 2…
 * Nunca se edita una ya publicada: cada cambio de formato es una migración nueva con su prueba.
 */
export const MIGRATIONS: Migration[] = [m001Initial, m002Programs]

export const SCHEMA_VERSION = MIGRATIONS.length
