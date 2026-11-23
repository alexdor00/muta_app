import { describe, expect, it } from 'vitest'
import { composicionDe, evolucionDe, grasaMarina, pesoConGrasa, semanasHasta } from './composition.ts'

describe('grasaMarina', () => {
  it('hombre: cuello y cintura; mujer: también la cadera (medidas en cm, fórmula en pulgadas)', () => {
    expect(grasaMarina('hombre', 180, { cuello: 38, cintura: 85, cadera: null })).toBeCloseTo(16.15, 2)
    expect(grasaMarina('mujer', 165, { cuello: 34, cintura: 75, cadera: 100 })).toBeCloseTo(29.24, 2)
  })

  it('sin cadera (mujer) o con la cintura menor que el cuello no da', () => {
    expect(grasaMarina('mujer', 165, { cuello: 34, cintura: 75, cadera: null })).toBeNull()
    expect(grasaMarina('hombre', 180, { cuello: 40, cintura: 38, cadera: null })).toBeNull()
  })
})

describe('composicionDe', () => {
  const base = { sexo: 'hombre' as const, alturaCm: 180, pesoKg: 80, cuello: 38, cintura: 85, cadera: null }

  it('grasa con rango ±3,5, masa magra, grasa en kg y FFMI corregido a 1,80 m', () => {
    expect(composicionDe({ ...base, calibracion: null })).toEqual({
      grasa: 16.2,
      rango: [12.7, 19.7],
      calibrado: false,
      bruta: 16.2,
      magraKg: 67.1,
      grasaKg: 12.9,
      ffmi: 20.7,
    })
  })

  it('calibrada: suma la diferencia y el rango baja a ±2', () => {
    const c = composicionDe({ ...base, calibracion: { medido: 14, diferencia: -2.2, fecha: '2026-11-01' } })
    expect(c?.grasa).toBe(14)
    expect(c?.rango).toEqual([12, 16])
    expect(c?.calibrado).toBe(true)
  })

  it('nunca baja del 3 % y sin cuello no hay estimación', () => {
    const c = composicionDe({ ...base, calibracion: { medido: 3, diferencia: -20, fecha: '2026-11-01' } })
    expect(c?.grasa).toBe(3)
    expect(composicionDe({ ...base, cuello: null, calibracion: null })).toBeNull()
  })
})

describe('peso objetivo', () => {
  it('el peso con un % de grasa conservando la masa magra', () => {
    expect(pesoConGrasa(68, 12)).toBe(77.3)
  })

  it('semanas a tu ritmo, solo si el ritmo va hacia ese peso', () => {
    expect(semanasHasta(80, 77.3, -0.5)).toBe(7)
    expect(semanasHasta(80, 77.3, 0.3)).toBeNull()
    expect(semanasHasta(80, 77.3, 0)).toBeNull()
  })
})

describe('evolucionDe', () => {
  it('un punto por cada cuello, con la cintura y el peso de entonces', () => {
    const ev = evolucionDe({
      sexo: 'hombre',
      alturaCm: 180,
      cuello: [
        { date: '2026-10-01', cm: 38 },
        { date: '2026-11-01', cm: 38 },
      ],
      cintura: [
        { date: '2026-09-28', cm: 88 },
        { date: '2026-11-01', cm: 85 },
      ],
      cadera: [],
      peso: [
        { date: '2026-09-30', tendencia: 82 },
        { date: '2026-10-31', tendencia: 80 },
      ],
      calibracion: null,
    })
    expect(ev.map((x) => x.date)).toEqual(['2026-10-01', '2026-11-01'])
    expect(ev[1].grasa).toBeLessThan(ev[0].grasa)
  })
})
