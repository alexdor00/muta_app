import { describe, expect, it } from 'vitest'
import { CATALOG, recommend, sourceOf, targetTier } from './catalog.ts'
import type { VolumeTier } from './programInfo.ts'

const everything = new Set(CATALOG.map(sourceOf))
const onlyMuta = new Set<string>()
// Volúmenes de prueba: las «Esencial» bajo, el resto medio
const infos = Object.fromEntries(
  CATALOG.map((e) => [
    e.id,
    {
      volume: (e.id.startsWith('esencial') ? 'bajo' : 'medio') as VolumeTier,
      equipment: e.id.startsWith('casa') ? 'home' : 'gym',
    } as const,
  ]),
)

describe('catálogo', () => {
  it('ids únicos y cada variante apunta a un archivo', () => {
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length)
    expect(CATALOG.filter((e) => e.variant).every((e) => e.source)).toBe(true)
  })
})

describe('recommend', () => {
  it('volumen que encaja: principiante bajo-medio, avanzado medio-alto; en definición medio punto menos', () => {
    expect(targetTier('beginner')).toBe(0.5)
    expect(targetTier('advanced')).toBe(1.5)
    expect(targetTier('intermediate', 'cut')).toBe(0.5)
  })

  it('recomienda rutinas de tus días', () => {
    const r = recommend({ daysPerWeek: 4, level: 'intermediate' }, everything, infos)
    expect(r.recommended.length).toBeGreaterThan(0)
    expect(r.recommended.every((e) => e.days.includes(4))).toBe(true)
  })

  it('en definición sube el volumen bajo; en volumen, el medio', () => {
    const cut = recommend({ daysPerWeek: 3, level: 'intermediate', phase: 'cut' }, everything, infos)
    const bulk = recommend({ daysPerWeek: 3, level: 'intermediate', phase: 'bulk' }, everything, infos)
    const pos = (list: typeof cut.recommended) => list.findIndex((e) => e.id === 'esencial-45min-3d')
    expect(pos(cut.recommended)).toBeLessThan(pos(bulk.recommended))
  })

  it('gimnasio antes que casa cuando el volumen empata', () => {
    const r = recommend({ daysPerWeek: 3, level: 'beginner' }, everything, infos)
    const ids = r.recommended.map((e) => e.id)
    expect(ids.indexOf('muta-cuerpo-completo-4d')).toBeLessThan(ids.indexOf('casa-peso-corporal'))
  })

  it('principiante con 5 días: se recomiendan de 4 con aviso y puede elegir de 5; nunca solo de 6', () => {
    const r = recommend({ daysPerWeek: 5, level: 'beginner' }, everything, infos)
    expect(r.targetDays).toBe(4)
    expect(r.notice).toMatch(/más días no es mejor/)
    expect(r.alsoAllowed.every((e) => e.days.includes(5))).toBe(true)
    expect([...r.recommended, ...r.alsoAllowed].some((e) => e.days.every((d) => d > 5))).toBe(false)
  })

  it('sin programas locales recomienda la propia más cercana en días', () => {
    const { recommended, others } = recommend({ daysPerWeek: 2, level: 'beginner' }, onlyMuta, infos)
    expect(recommended.map((e) => e.id)).toEqual(['muta-cuerpo-completo-4d'])
    expect(others.map((e) => e.id)).toEqual(['muta-ppl-6d'])
  })

  it('lo que no se recomienda queda en «otras» sin repetirse', () => {
    const { recommended, alsoAllowed, others } = recommend(
      { daysPerWeek: 4, level: 'advanced' },
      everything,
      infos,
    )
    expect(recommended.length + alsoAllowed.length + others.length).toBe(CATALOG.length)
    expect(recommended.some((e) => others.includes(e))).toBe(false)
  })
})
