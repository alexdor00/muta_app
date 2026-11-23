import { describe, expect, it } from 'vitest'
import { cuandoToca, PERIMETROS, resumenMedidas, serieDe, ultimaHasta } from './measures.ts'

describe('resumenMedidas', () => {
  it('la última medida, el cambio frente a la anterior y desde la primera, y las últimas para la mini-gráfica', () => {
    const r = resumenMedidas([
      { date: '2026-10-01', brazo: 38, cintura: 84 },
      { date: '2026-11-01', brazo: 38.5 },
      { date: '2026-11-29', brazo: 38.2 },
    ])
    expect(r.brazo).toEqual({
      cm: 38.2,
      fecha: '2026-11-29',
      desde: '2026-10-01',
      cambio: 0.2,
      anterior: -0.3,
      ultimas: [38, 38.5, 38.2],
    })
    expect(r.cintura).toEqual({
      cm: 84,
      fecha: '2026-10-01',
      desde: null,
      cambio: null,
      anterior: null,
      ultimas: [84],
    })
    expect(r.pecho).toBeNull()
  })

  it('las siete medidas del mes, cada una con cómo tomarla', () => {
    expect(PERIMETROS.map((p) => p.id)).toEqual([
      'brazo',
      'pecho',
      'cintura',
      'muslo',
      'gemelo',
      'cadera',
      'cuello',
    ])
    expect(PERIMETROS.every((p) => p.como.length > 10)).toBe(true)
    expect(resumenMedidas([{ date: '2026-11-01', cuello: 38 }]).cuello?.cm).toBe(38)
  })

  it('la cintura suma la de la consulta y, el mismo día, manda la medida', () => {
    const cinturas = [
      { date: '2026-10-01', cm: 86 },
      { date: '2026-10-15', cm: 85 },
    ]
    expect(serieDe('cintura', [{ date: '2026-10-15', cintura: 84.5 }], cinturas)).toEqual([
      { date: '2026-10-01', cm: 86 },
      { date: '2026-10-15', cm: 84.5 },
    ])
    expect(resumenMedidas([], cinturas).cintura?.cambio).toBe(-1)
  })
})

describe('ultimaHasta', () => {
  it('la última medida en esa fecha o antes', () => {
    const s = [
      { date: '2026-10-01', cm: 86 },
      { date: '2026-11-01', cm: 85 },
    ]
    expect(ultimaHasta(s, '2026-10-20')).toBe(86)
    expect(ultimaHasta(s, '2026-11-01')).toBe(85)
    expect(ultimaHasta(s, '2026-09-01')).toBeNull()
  })
})

describe('cuandoToca', () => {
  it('ahora si nunca o si pasaron 28 días; si no, en cuántos', () => {
    expect(cuandoToca([], '2026-11-10')).toEqual({ ahora: true, enDias: 0, ultima: null })
    expect(cuandoToca(['2026-10-01', '2026-11-01'], '2026-11-10')).toEqual({
      ahora: false,
      enDias: 19,
      ultima: '2026-11-01',
    })
    expect(cuandoToca(['2026-10-01'], '2026-11-10').ahora).toBe(true)
  })

  it('con tu día del mes: desde ese día hasta que las hagas; hechas, el mismo día del mes siguiente', () => {
    // Elegiste el 15: el 10 de noviembre, hechas el 16 de octubre → toca el 15 de noviembre
    expect(cuandoToca(['2026-10-16'], '2026-11-10', 15)).toEqual({
      ahora: false,
      enDias: 5,
      ultima: '2026-10-16',
    })
    // Llegó el 15 y no las hiciste: toca (y sigue tocando el 20)
    expect(cuandoToca(['2026-10-16'], '2026-11-15', 15).ahora).toBe(true)
    expect(cuandoToca(['2026-10-16'], '2026-11-20', 15).ahora).toBe(true)
    // Hechas el 15: la siguiente, el 15 de diciembre
    expect(cuandoToca(['2026-11-15'], '2026-11-15', 15).enDias).toBe(30)
    // Antes de tu día, sin hacer las del mes pasado: toca
    expect(cuandoToca(['2026-09-20'], '2026-11-10', 15).ahora).toBe(true)
    // Cambio de año
    expect(cuandoToca(['2026-12-02'], '2026-12-20', 1).enDias).toBe(12)
  })
})
