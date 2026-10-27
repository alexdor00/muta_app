import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { BackupError, exportBackup, importBackup, needsBackupReminder } from './backup/backup.ts'
import { openDatabase, runTx } from './db.ts'
import { readErrors, saveError } from './errorLog.ts'
import { SCHEMA_VERSION } from './migrations/index.ts'
import { isAlive, newRecord, softDelete } from './records.ts'
import { STORE_NAMES } from './schema.ts'

let n = 0
const freshDb = () => openDatabase(`test-${++n}`)

describe('base de datos', () => {
  it('crea todos los almacenes con sus índices y guarda la versión', async () => {
    const db = await freshDb()
    expect([...db.objectStoreNames].sort()).toEqual([...STORE_NAMES].sort())
    expect([...db.transaction('workouts').store.indexNames].sort()).toEqual(['date', 'status'])
    expect(await db.get('meta', 'schemaVersion')).toEqual({ key: 'schemaVersion', value: SCHEMA_VERSION })
  })

  it('una transacción que falla no guarda nada', async () => {
    const db = await freshDb()
    await expect(
      runTx(db, ['workouts', 'rotation'], async (tx) => {
        await tx.objectStore('workouts').put({ id: 'w1', date: '2026-10-27', status: 'done' })
        throw new Error('fallo a mitad')
      }),
    ).rejects.toThrow('fallo a mitad')
    expect(await db.get('workouts', 'w1')).toBeUndefined()
  })

  it('una transacción correcta guarda todo', async () => {
    const db = await freshDb()
    await runTx(db, ['workouts', 'rotation'], async (tx) => {
      await tx.objectStore('workouts').put({ id: 'w1', date: '2026-10-27', status: 'done' })
      await tx.objectStore('rotation').put({ id: 'current', pointer: 1 })
    })
    expect(await db.get('workouts', 'w1')).toBeDefined()
    expect(await db.get('rotation', 'current')).toEqual({ id: 'current', pointer: 1 })
  })
})

describe('copia de seguridad', () => {
  it('exportar e importar en otra base deja los mismos datos', async () => {
    const a = await freshDb()
    await a.put('workouts', { id: 'w1', date: '2026-10-27', status: 'done' })
    await a.put('exerciseHistory', { exerciseId: 'press_banca', date: '2026-10-27', e1rm: 84 })
    const backup = JSON.parse(JSON.stringify(await exportBackup(a)))

    const b = await freshDb()
    await importBackup(b, backup)
    expect(await b.getAll('workouts')).toEqual(await a.getAll('workouts'))
    expect(await b.get('exerciseHistory', ['press_banca', '2026-10-27'])).toMatchObject({ e1rm: 84 })
  })

  it('exportar apunta la fecha de la última copia', async () => {
    const db = await freshDb()
    await exportBackup(db, new Date('2026-10-27T10:00:00Z'))
    expect(await db.get('meta', 'lastBackupAt')).toEqual({
      key: 'lastBackupAt',
      value: '2026-10-27T10:00:00.000Z',
    })
  })

  it('un archivo que no es una copia se rechaza y no toca nada', async () => {
    const db = await freshDb()
    await db.put('workouts', { id: 'w1', date: '2026-10-27', status: 'done' })
    await expect(importBackup(db, { hola: 1 })).rejects.toBeInstanceOf(BackupError)
    expect(await db.get('workouts', 'w1')).toBeDefined()
  })

  it('una copia con una fila dañada se rechaza y no toca nada', async () => {
    const db = await freshDb()
    await db.put('workouts', { id: 'w1', date: '2026-10-27', status: 'done' })
    const bad = {
      format: 'muta-backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: '2026-10-27T10:00:00Z',
      stores: { workouts: [{ id: 'w2' }, { sinId: true }] },
    }
    await expect(importBackup(db, bad)).rejects.toBeInstanceOf(BackupError)
    expect(await db.getAllKeys('workouts')).toEqual(['w1'])
  })

  it('una copia de una versión más nueva se rechaza', async () => {
    const db = await freshDb()
    const future = { format: 'muta-backup', schemaVersion: SCHEMA_VERSION + 1, exportedAt: '', stores: {} }
    await expect(importBackup(db, future)).rejects.toThrow('versión más nueva')
  })

  it('avisa de hacer copia cada 14 días o si nunca se hizo', () => {
    const now = new Date('2026-10-27T10:00:00Z')
    expect(needsBackupReminder(null, now)).toBe(true)
    expect(needsBackupReminder('2026-10-20T10:00:00Z', now)).toBe(false)
    expect(needsBackupReminder('2026-10-13T10:00:00Z', now)).toBe(true)
  })
})

describe('registro de errores', () => {
  it('guarda los errores y se queda con los últimos 200', async () => {
    const db = await freshDb()
    for (let i = 0; i < 205; i++) await saveError(db, { at: `t${i}`, where: 'prueba', message: `e${i}` })
    const errors = await readErrors(db)
    expect(errors).toHaveLength(200)
    expect(errors[0].message).toBe('e5')
    expect(errors.at(-1)?.message).toBe('e204')
  })
})

describe('registros', () => {
  it('borrar es marcar, no eliminar', () => {
    const r = newRecord({ name: 'A1' }, new Date('2026-10-27T10:00:00Z'))
    expect(r).toMatchObject({ name: 'A1', deletedAt: null, createdAt: '2026-10-27T10:00:00.000Z' })
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/)
    const gone = softDelete(r, new Date('2026-10-28T10:00:00Z'))
    expect(isAlive(gone)).toBe(false)
    expect(gone).toMatchObject({ id: r.id, updatedAt: '2026-10-28T10:00:00.000Z' })
  })
})
