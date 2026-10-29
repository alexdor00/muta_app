import { describe, expect, it } from 'vitest'
import { CATALOG } from './catalog.ts'
import { CATEGORIES, isAdaptable } from './categories.ts'

describe('tipos de entrenamiento', () => {
  it('cada tipo tiene un id único, título y descripción', () => {
    const ids = CATEGORIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of CATEGORIES) {
      expect(c.title).not.toBe('')
      expect(c.description).not.toBe('')
    }
  })

  it('cada rutina del catálogo pertenece a un tipo que existe', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id))
    for (const entry of CATALOG) expect(ids.has(entry.family)).toBe(true)
  })

  it('todos los tipos tienen al menos una rutina', () => {
    for (const c of CATEGORIES) expect(CATALOG.some((e) => e.family === c.id)).toBe(true)
  })

  it('el coach no ajusta las esenciales ni la vuelta al gimnasio', () => {
    expect(isAdaptable(['esencial'])).toBe(false)
    expect(isAdaptable(['extras'])).toBe(false)
    expect(isAdaptable(['culturismo'])).toBe(true)
    expect(isAdaptable(['muta'])).toBe(true)
  })
})
