import { describe, expect, it } from 'vitest'
import { CATALOG, levelOf, recommend, type MeasuredLevels } from './catalog.ts'

// Niveles de prueba: unas de cada (las reales los mide scripts/program-levels.ts)
const MEASURED: MeasuredLevels = Object.fromEntries(
  CATALOG.map((e, i) => [e.id, (['beginner', 'intermediate', 'advanced'] as const)[i % 3]]),
)
const everything = new Set(CATALOG.map((entry) => entry.id))
const onlyMuta = new Set<string>()

describe('recommend', () => {
  it('cada id del catálogo es único y tiene nivel medido', () => {
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length)
    expect(
      CATALOG.every((e) => ['beginner', 'intermediate', 'advanced'].includes(levelOf(e, MEASURED))),
    ).toBe(true)
  })

  it('recomienda rutinas de tus días; primero las de tu nivel medido, luego las adaptadas', () => {
    const r = recommend({ daysPerWeek: 4, level: 'intermediate' }, everything, MEASURED)
    expect(r.recommended.every((e) => e.days.includes(4))).toBe(true)
    const native = r.recommended.map((e) => !r.adjusted.has(e.id))
    // Ninguna de tu nivel aparece después de una adaptada
    expect(native.indexOf(false) === -1 || native.slice(native.indexOf(false)).every((x) => !x)).toBe(true)
  })

  it('adaptadas = las de nivel medido distinto al tuyo', () => {
    const r = recommend({ daysPerWeek: 5, level: 'advanced' }, everything, MEASURED)
    for (const e of CATALOG) expect(r.adjusted.has(e.id)).toBe(levelOf(e, MEASURED) !== 'advanced')
  })

  it('principiante con 5 días: se recomiendan de 4 con aviso y puede elegir de 5; nunca solo de 6', () => {
    const r = recommend({ daysPerWeek: 5, level: 'beginner' }, everything, MEASURED)
    expect(r.targetDays).toBe(4)
    expect(r.notice).toMatch(/más días no es mejor/)
    expect(r.recommended.every((e) => e.days.includes(4))).toBe(true)
    expect(r.alsoAllowed.length).toBeGreaterThan(0)
    expect(r.alsoAllowed.every((e) => e.days.includes(5))).toBe(true)
    expect([...r.recommended, ...r.alsoAllowed].some((e) => e.days.every((d) => d > 5))).toBe(false)
  })

  it('principiante con 4 días o menos: sin aviso ni opciones de 5', () => {
    const r = recommend({ daysPerWeek: 4, level: 'beginner' }, everything, MEASURED)
    expect(r.notice).toBeNull()
    expect(r.alsoAllowed).toEqual([])
  })

  it('sin programas locales recomienda la propia más cercana en días', () => {
    const { recommended, others } = recommend({ daysPerWeek: 2, level: 'beginner' }, onlyMuta, MEASURED)
    expect(recommended.map((e) => e.id)).toEqual(['muta-cuerpo-completo-4d'])
    expect(others.map((e) => e.id)).toEqual(['muta-ppl-6d'])
  })

  it('lo que no se recomienda queda en «otras» y no se repite', () => {
    const { recommended, alsoAllowed, others } = recommend(
      { daysPerWeek: 4, level: 'advanced' },
      everything,
      MEASURED,
    )
    expect(recommended.length + alsoAllowed.length + others.length).toBe(CATALOG.length)
    expect(recommended.some((e) => others.includes(e))).toBe(false)
  })
})
