import { describe, expect, it } from 'vitest'
import { enRecarga, finDeRecarga, rendimientoCae, tocaRecarga } from './refeed.ts'

const cae = { peoresRecientes: 2, recientes: 3, peoresAntes: 0, antes: 4 }

describe('la recarga de hidratos', () => {
  it('el rendimiento cae en varias sesiones tras venir estable; una sola sesión mala no basta', () => {
    expect(rendimientoCae(cae)).toBe(true)
    expect(rendimientoCae({ ...cae, peoresRecientes: 1 })).toBe(false)
    expect(rendimientoCae({ ...cae, peoresAntes: 3 })).toBe(false)
    expect(rendimientoCae(null)).toBe(false)
  })
  it('solo en definición, desde la semana 8 y como mucho una cada 3 semanas', () => {
    const base = {
      fase: 'definicion' as const,
      semanaFase: 9,
      rendimiento: cae,
      ultima: null,
      hoy: '2026-11-09',
    }
    expect(tocaRecarga(base)).toBe(true)
    expect(tocaRecarga({ ...base, semanaFase: 5 })).toBe(false)
    expect(tocaRecarga({ ...base, fase: 'volumen' })).toBe(false)
    expect(tocaRecarga({ ...base, ultima: { desde: '2026-10-25', hasta: '2026-10-31' } })).toBe(false)
    expect(tocaRecarga({ ...base, ultima: { desde: '2026-10-10', hasta: '2026-10-16' } })).toBe(true)
  })
  it('dura una vuelta de tu rutina: hasta el día en que haces tantos entrenos como sesiones tiene', () => {
    const entrenaLMXV = (f: string) => [1, 3, 5].includes(new Date(`${f}T12:00:00`).getDay())
    expect(finDeRecarga('2026-11-09', 3, entrenaLMXV)).toBe('2026-11-13')
    expect(enRecarga({ desde: '2026-11-09', hasta: '2026-11-13' }, '2026-11-12')).toBe(true)
    expect(enRecarga({ desde: '2026-11-09', hasta: '2026-11-13' }, '2026-11-14')).toBe(false)
  })
})
