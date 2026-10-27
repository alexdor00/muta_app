import 'fake-indexeddb/auto'
import { openDB } from 'idb'
import { describe, expect, it, vi } from 'vitest'

// Simula que existe una versión 2 para comprobar la copia previa y el paso de datos.
vi.mock('./index.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('./index.ts')>()
  const m002 = vi.fn()
  const MIGRATIONS = [...real.MIGRATIONS, m002]
  return { ...real, MIGRATIONS, SCHEMA_VERSION: MIGRATIONS.length }
})

const { MIGRATIONS } = await import('./index.ts')
const { m001Initial } = await import('./001-initial.ts')
const { openDatabase } = await import('../db.ts')

describe('migraciones', () => {
  it('antes de migrar guarda una copia y conserva los datos', async () => {
    // Base en versión 1 con un entreno guardado.
    const v1 = await openDB('migra', 1, {
      upgrade: (db, _o, _n, tx) => m001Initial(db, tx as never),
    })
    await v1.put('workouts', { id: 'w1', date: '2026-10-27', status: 'done' })
    v1.close()

    const db = await openDatabase('migra')
    expect(db.version).toBe(2)
    expect(MIGRATIONS[1]).toHaveBeenCalledOnce()
    expect(await db.get('workouts', 'w1')).toBeDefined()

    const snapshots = await openDB('muta-backups', 1)
    const [copy] = await snapshots.getAll('snapshots')
    expect(copy).toMatchObject({ db: 'migra', schemaVersion: 1 })
    expect(copy.stores.workouts).toEqual([{ id: 'w1', date: '2026-10-27', status: 'done' }])
  })
})
