import { describe, expect, it } from 'vitest'
import { aboutOf } from './about.ts'
import { CATALOG } from './catalog.ts'

describe('de qué trata cada rutina', () => {
  it('todas las rutinas del catálogo tienen su información', () => {
    const missing = CATALOG.filter((e) => !aboutOf(e)).map((e) => e.id)
    expect(missing).toEqual([])
  })

  it('las versiones de un mismo programa comparten texto y añaden su nota', () => {
    const six = aboutOf({ id: 'vuelta-ppl' })!
    const four = aboutOf({ id: 'vuelta-torso-pierna' })!
    expect(six.summary).toBe(four.summary)
    expect(six.note).toMatch(/6 días/)
    expect(four.note).toMatch(/4 días/)
  })

  it('sin nombres de personas', () => {
    const text = JSON.stringify(CATALOG.map(aboutOf))
    expect(text).not.toMatch(/nippard|buttermore|jeff|stephanie|yates|meadows/i)
  })
})

describe('mejora los básicos', () => {
  const marked = CATALOG.filter((e) => aboutOf(e)?.basics).map((e) => e.id)

  it('solo las que lo dicen como objetivo en su documento', () => {
    expect(marked).toEqual([
      'fuerza-hipertrofia-1-6d',
      'fuerza-hipertrofia-2-4d',
      'fuerza-hipertrofia-2-6d',
      'fuerza-hipertrofia-3-5d',
      'especializacion-sentadilla',
      'especializacion-banca',
      'ppl-tecnica',
      'torso-pierna',
      'mujer-especializacion',
    ])
  })

  it('el filtro «mejoran los básicos» deja justo esas', async () => {
    const { matches } = await import('./routineView.ts')
    const item = (e: (typeof CATALOG)[number]) => ({ entry: e, info: {} as never })
    expect(CATALOG.filter((e) => matches(item(e), { basics: 'si' })).map((e) => e.id)).toEqual(marked)
  })
})
