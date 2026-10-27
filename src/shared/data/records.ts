// Campos comunes a todo lo que guarda el usuario: listos para sincronizar en el futuro.

export type BaseRecord = {
  id: string
  createdAt: string
  updatedAt: string
  /** Borrar es marcar: la fila se queda con la fecha de borrado. */
  deletedAt: string | null
}

export function newRecord<T extends object>(data: T, now = new Date()): T & BaseRecord {
  const at = now.toISOString()
  return { ...data, id: crypto.randomUUID(), createdAt: at, updatedAt: at, deletedAt: null }
}

export function touch<T extends BaseRecord>(record: T, changes: Partial<T>, now = new Date()): T {
  return { ...record, ...changes, updatedAt: now.toISOString() }
}

export function softDelete<T extends BaseRecord>(record: T, now = new Date()): T {
  return touch(record, { deletedAt: now.toISOString() } as Partial<T>, now)
}

export function isAlive(record: BaseRecord): boolean {
  return record.deletedAt === null
}
