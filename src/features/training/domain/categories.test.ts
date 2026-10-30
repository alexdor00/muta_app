import { describe, expect, it } from 'vitest'
import { CATALOG } from './catalog.ts'
import { CATEGORIES, CATEGORY_OF_FAMILY, categoryOf, isAdaptable } from './categories.ts'

describe('grupos de entrenamiento', () => {
  it('cada grupo tiene un id único, título y descripción', () => {
    const ids = CATEGORIES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of CATEGORIES) {
      expect(c.title).not.toBe('')
      expect(c.description).not.toBe('')
    }
  })

  it('cada familia va a un grupo que existe, y cada grupo tiene al menos una rutina', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id))
    for (const group of Object.values(CATEGORY_OF_FAMILY)) expect(ids.has(group)).toBe(true)
    for (const c of CATEGORIES) expect(CATALOG.some((e) => categoryOf(e.family) === c.id)).toBe(true)
  })

  it('reparte las 40 rutinas: hipertrofia 19 (con las 2 de MUTA), powerbuilding 5, powerlifting 2, mujer 12 y vuelta 2', () => {
    const count = (id: string) => CATALOG.filter((e) => categoryOf(e.family) === id).length
    expect(CATEGORIES.map((c) => [c.id, count(c.id)])).toEqual([
      ['hipertrofia', 19],
      ['powerbuilding', 5],
      ['powerlifting', 2],
      ['mujer', 12],
      ['vuelta', 2],
    ])
    expect(CATALOG).toHaveLength(40)
  })

  it('MUTA va en hipertrofia', () => {
    expect(categoryOf('muta')).toBe('hipertrofia')
  })

  it('cada grupo lleva su «!»: qué es, para quién y cómo elegir, en textos cortos', () => {
    for (const { about } of CATEGORIES) {
      expect(about.summary.length).toBeGreaterThan(0)
      expect(about.forWho.length).toBeGreaterThan(0)
      expect(about.how.length).toBeGreaterThan(0)
      for (const line of [about.summary, about.forWho, ...about.how])
        expect(line.length).toBeLessThanOrEqual(190)
    }
  })

  it('el programa de 45 minutos va en hipertrofia (su documento dice hipertrofia con poco volumen), no aparte', () => {
    expect(categoryOf('esencial')).toBe('hipertrofia')
    expect(CATEGORIES.some((c) => c.id.includes('manten'))).toBe(false)
  })

  it('el coach no ajusta las esenciales ni la vuelta al gimnasio', () => {
    expect(isAdaptable(['esencial'])).toBe(false)
    expect(isAdaptable(['extras'])).toBe(false)
    expect(isAdaptable(['culturismo'])).toBe(true)
    expect(isAdaptable(['muta'])).toBe(true)
  })
})
