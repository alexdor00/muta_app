import { describe, expect, it } from 'vitest'
import { CATALOG, recommend } from './catalog.ts'

const everything = new Set(CATALOG.map((entry) => entry.id))
const onlyMuta = new Set<string>()

describe('recommend', () => {
  it('principiante, 3 días: rutinas de 3 días para su nivel, las propias primero', () => {
    const { recommended } = recommend({ daysPerWeek: 3, level: 'beginner' }, everything)
    expect(recommended[0].id).toBe('muta-cuerpo-completo-4d')
    expect(recommended.map((e) => e.id)).toEqual(
      expect.arrayContaining(['esencial-45min-3d', 'mujer-base', 'mujer-casa']),
    )
    expect(recommended.every((e) => e.days.includes(3) && e.levels.includes('beginner'))).toBe(true)
  })

  it('intermedio, 6 días: incluye el empuje, tirón y pierna propio', () => {
    const { recommended } = recommend({ daysPerWeek: 6, level: 'intermediate' }, everything)
    expect(recommended[0].id).toBe('muta-ppl-6d')
    expect(recommended.every((e) => e.days.includes(6))).toBe(true)
  })

  it('sin programas locales recomienda la propia más cercana en días', () => {
    const { recommended, others } = recommend({ daysPerWeek: 2, level: 'beginner' }, onlyMuta)
    expect(recommended.map((e) => e.id)).toEqual(['muta-cuerpo-completo-4d'])
    expect(others.map((e) => e.id)).toEqual(['muta-ppl-6d'])
  })

  it('lo que no se recomienda queda en «otras» y no se repite', () => {
    const { recommended, others } = recommend({ daysPerWeek: 4, level: 'advanced' }, everything)
    expect(recommended.length + others.length).toBe(CATALOG.length)
    expect(recommended.some((e) => others.includes(e))).toBe(false)
  })

  it('principiante con 5 o 6 días: se recomiendan de 4, con aviso, y puede elegir de 5', () => {
    for (const days of [5, 6]) {
      const r = recommend({ daysPerWeek: days, level: 'beginner' }, everything)
      expect(r.targetDays).toBe(4)
      expect(r.notice).toMatch(/más días no es mejor/)
      expect(r.recommended.every((e) => e.days.includes(4))).toBe(true)
      expect(r.alsoAllowed.length).toBeGreaterThan(0)
      expect(r.alsoAllowed.every((e) => e.days.includes(5))).toBe(true)
      // Nunca se le ofrece una solo de 6 días
      expect([...r.recommended, ...r.alsoAllowed].some((e) => e.days.every((d) => d > 5))).toBe(false)
    }
  })

  it('principiante con 4 días o menos: sin aviso ni opciones de 5', () => {
    const r = recommend({ daysPerWeek: 4, level: 'beginner' }, everything)
    expect(r.notice).toBeNull()
    expect(r.alsoAllowed).toEqual([])
  })

  it('principiante: las de intermedio entran ajustadas; las solo de avanzado no', () => {
    const r = recommend({ daysPerWeek: 5, level: 'beginner' }, everything)
    const ids = r.alsoAllowed.map((e) => e.id)
    expect(ids).toContain('hipertrofia-cuerpo-completo-5d-f1')
    expect(r.adjusted.has('hipertrofia-cuerpo-completo-5d-f1')).toBe(true)
    expect(ids).not.toContain('fuerza-hipertrofia-3-5d') // solo avanzado
    expect(r.adjusted.has('esencial-45min-5d')).toBe(false) // ya es para principiante
    // Las pensadas para su nivel van antes que las ajustadas
    const firstAdjusted = ids.findIndex((id) => r.adjusted.has(id))
    expect(ids.slice(firstAdjusted).every((id) => r.adjusted.has(id))).toBe(true)
  })

  it('intermedio y avanzado no llevan aviso ni ajustes', () => {
    const r = recommend({ daysPerWeek: 6, level: 'intermediate' }, everything)
    expect(r.notice).toBeNull()
    expect(r.adjusted.size).toBe(0)
  })

  it('cada id del catálogo es único', () => {
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length)
  })
})
