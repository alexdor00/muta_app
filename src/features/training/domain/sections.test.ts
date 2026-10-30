import { describe, expect, it } from 'vitest'
import { CATALOG } from './catalog.ts'
import { CATEGORIES, categoryOf } from './categories.ts'
import { daysOf, inSection, pickDays, programOf, sectionAbout, sectionsOf } from './sections.ts'

const mujer = CATALOG.filter((e) => e.family === 'mujer').map((entry) => ({ entry }))
const [base, gluteoTrenInferior, enCasa] = sectionsOf('mujer')

describe('secciones de Mujer', () => {
  it('Mujer tiene tres categorías; lo guardado y lo desconocido, ninguna', () => {
    expect(sectionsOf('mujer').map((s) => s.id)).toEqual(['base', 'gluteo-tren-inferior', 'en-casa'])
    expect(sectionsOf('guardadas')).toEqual([])
    expect(sectionsOf('no-existe')).toEqual([])
  })

  it('cada uno de los demás tipos (menos Hipertrofia) tiene una sola sección con todas sus rutinas, elegida por días', () => {
    for (const { id, title } of CATEGORIES.filter((c) => c.id !== 'mujer' && c.id !== 'hipertrofia')) {
      const sections = sectionsOf(id)
      expect(sections).toHaveLength(1)
      expect(sections[0]).toMatchObject({ title, programs: null, byDays: true })
      expect(inSection(sections[0], mujer)).toEqual(mujer)
    }
  })

  it('el programa es el título hasta « · »; sin él, el título entero', () => {
    expect(programOf('Base · torso y pierna')).toBe('Base')
    expect(programOf('En casa · intermedio · torso y pierna')).toBe('En casa')
    expect(programOf('Glúteo')).toBe('Glúteo')
  })

  it('reparte las 12 rutinas: 3 en Base, 3 en Especialización en glúteo y tren inferior y 6 en En casa, sin repetir ninguna', () => {
    const parts = [base, gluteoTrenInferior, enCasa].map((s) => inSection(s, mujer))
    expect(parts.map((p) => p.length)).toEqual([3, 3, 6])
    expect(new Set(parts.flat().map((i) => i.entry.id)).size).toBe(mujer.length)
  })

  it('los días de cada sección', () => {
    expect(daysOf(inSection(base, mujer))).toEqual([3, 4, 5])
    expect(daysOf(inSection(enCasa, mujer))).toEqual([3, 4])
    expect(daysOf(inSection(gluteoTrenInferior, mujer))).toEqual([5, 6])
  })

  it('las tres secciones de Mujer se eligen por días', () => {
    expect([base, gluteoTrenInferior, enCasa].map((s) => s.byDays)).toEqual([true, true, true])
  })
})

describe('secciones de Hipertrofia', () => {
  const hipertrofia = CATALOG.filter((e) => categoryOf(e.family) === 'hipertrofia').map((entry) => ({
    entry,
  }))
  const sections = sectionsOf('hipertrofia')

  it('cinco secciones: MUTA, culturismo, cuerpo completo de frecuencia alta, empuje-tirón-pierna y esencial', () => {
    expect(sections.map((x) => x.id)).toEqual(['muta', 'culturismo', 'frecuencia-alta', 'ppl', 'esencial'])
  })

  it('reparten las 19 rutinas: ninguna sin sección ni en dos', () => {
    const parts = sections.map((x) => inSection(x, hipertrofia))
    expect(parts.map((p) => p.length)).toEqual([2, 6, 2, 5, 4])
    expect(new Set(parts.flat().map((i) => i.entry.id)).size).toBe(hipertrofia.length)
  })

  it('todas las tarjetas llevan «!»: propia si sus rutinas vienen de documentos distintos, y si no, la del documento', () => {
    const [muta, culturismo, alta, ppl, esencial] = sections
    expect(muta.about && culturismo.about && ppl.about).toBeTruthy() // documentos distintos: texto propio
    expect(alta.about).toBeUndefined()
    expect(esencial.about).toBeUndefined()
    expect(sectionAbout(esencial, inSection(esencial, hipertrofia))?.summary).toMatch(/imprescindible/i)
    expect(sectionAbout(alta, inSection(alta, hipertrofia))).not.toBeNull()
    for (const section of sections)
      expect(sectionAbout(section, inSection(section, hipertrofia))).not.toBeNull()
  })
})

describe('la «!» de cada sección', () => {
  it('lleva resumen, para quién y cómo funciona, y son textos cortos', () => {
    for (const section of [...sectionsOf('mujer'), ...sectionsOf('hipertrofia')].filter((x) => x.about)) {
      const { summary, forWho, how } = section.about!
      expect(summary.length).toBeGreaterThan(0)
      expect(forWho.length).toBeGreaterThan(0)
      expect(how.length).toBeGreaterThan(0)
      for (const line of [summary, forWho, ...how]) expect(line.length).toBeLessThanOrEqual(170)
    }
  })
})

describe('pickDays', () => {
  it('los pedidos si existen, si no los más cercanos, y sin petición los primeros', () => {
    expect(pickDays([3, 4, 5], 4)).toBe(4)
    expect(pickDays([3, 4], 6)).toBe(4)
    expect(pickDays([3, 4, 5], 2)).toBe(3)
    expect(pickDays([3, 4, 5], undefined)).toBe(3)
  })
})
