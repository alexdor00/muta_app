import { describe, expect, it } from 'vitest'
import { CATALOG, recommend, type MeasuredLevels } from './catalog.ts'
import { FAMILIES, familySummary, groupByFamily } from './families.ts'

// Niveles de prueba: unas de cada (las reales los mide scripts/program-levels.ts)
const MEASURED: MeasuredLevels = Object.fromEntries(
  CATALOG.map((e, i) => [e.id, (['beginner', 'intermediate', 'advanced'] as const)[i % 3]]),
)
const everything = new Set(CATALOG.map((e) => e.id))

describe('familias', () => {
  it('cada rutina del catálogo pertenece a una familia que existe', () => {
    const ids = new Set(FAMILIES.map((f) => f.id))
    expect(CATALOG.every((e) => ids.has(e.family))).toBe(true)
  })

  it('agrupa sin perder ni repetir rutinas y respeta el orden', () => {
    const { recommended } = recommend({ daysPerWeek: 4, level: 'intermediate' }, everything, MEASURED)
    const groups = groupByFamily(recommended)
    expect(groups.flatMap((g) => g.entries)).toHaveLength(recommended.length)
    expect(groups[0].entries[0]).toBe(recommended[0])
    expect(new Set(groups.map((g) => g.family.id)).size).toBe(groups.length)
  })

  it('con 4 días e intermedio hay muchas menos tarjetas que rutinas', () => {
    const { recommended } = recommend({ daysPerWeek: 4, level: 'intermediate' }, everything, MEASURED)
    expect(groupByFamily(recommended).length).toBeLessThan(recommended.length)
  })

  it('resumen: número de opciones y rango de días', () => {
    const esencial = CATALOG.filter((e) => e.family === 'esencial')
    expect(familySummary(esencial)).toBe('4 opciones · 2–5 días')
    expect(familySummary([esencial[0]])).toBe(esencial[0].subtitle)
  })
})
