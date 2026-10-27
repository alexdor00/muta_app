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

  it('cada id del catálogo es único', () => {
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length)
  })
})
