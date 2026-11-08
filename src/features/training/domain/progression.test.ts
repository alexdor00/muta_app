import { describe, expect, it } from 'vitest'
import { floorTo, suggestFor, type SerieAnterior } from './progression.ts'

const serie = (kg: number | null, reps: number, rir: number | null = null): SerieAnterior => ({
  kg,
  reps,
  rir,
})
const plan = { rango: [6, 10] as [number, number], rir: 2, salto: 2.5 }

describe('floorTo', () => {
  it('redondea hacia abajo al salto', () => {
    expect(floorTo(63.7, 2.5)).toBe(62.5)
    expect(floorTo(62.5, 2.5)).toBe(62.5)
    expect(floorTo(23.9, 2)).toBe(22)
  })
})

describe('suggestFor (doble progresión)', () => {
  it('llegar al máximo del rango sube el salto y vuelve abajo (la captura A09)', () => {
    expect(suggestFor({ ...plan, ultima: [serie(60, 10), serie(62.5, 6)] })).toEqual({
      kg: 62.5,
      reps: '6–10',
      tendencia: 'sube',
      porque: 'Llegaste a 10 reps: subes 2,5 kg y vuelves a la parte baja del rango.',
    })
  })
  it('cada serie usa la misma serie de la última vez', () => {
    expect(suggestFor({ ...plan, ultima: [serie(60, 10), serie(62.5, 6)] }, 1).kg).toBe(62.5)
    expect(suggestFor({ ...plan, ultima: [serie(60, 10), serie(62.5, 6)] }, 1).reps).toBe('7')
  })
  it('al máximo pero muy cerca del fallo de más (RIR > objetivo + 1) no sube', () => {
    expect(suggestFor({ ...plan, ultima: [serie(60, 10, 4)] }).tendencia).toBe('igual')
  })
  it('pasarse 2 o más del máximo sube lo que da el 1RM, con tope del 10 %', () => {
    const s = suggestFor({ ...plan, ultima: [serie(60, 14, 2)] })
    // 1RM 60 × (1 + 16/30) = 92; 92 / (1 + 8/30) = 72,6 → tope 66
    expect(s.kg).toBe(65)
    expect(s.tendencia).toBe('sube')
  })
  it('sobrar 3 o más de reserva dentro del rango también sube', () => {
    expect(suggestFor({ ...plan, ultima: [serie(60, 8, 5)] })).toMatchObject({
      kg: 62.5,
      porque: 'Te sobraron 5 reps en reserva (tocaba RIR 2): subes 2,5 kg.',
    })
  })
  it('por debajo del mínimo baja un 5 % (al menos un salto)', () => {
    expect(suggestFor({ ...plan, ultima: [serie(60, 5)] })).toMatchObject({ kg: 55, tendencia: 'baja' })
    expect(suggestFor({ ...plan, salto: 5, ultima: [serie(20, 4)] }).kg).toBe(15)
  })
  it('dentro del rango, mismo peso y una rep más', () => {
    expect(suggestFor({ ...plan, ultima: [serie(60, 7)] })).toEqual({
      kg: 60,
      reps: '8',
      tendencia: 'igual',
      porque: 'Mismo peso y busca 8 reps (la última vez 7).',
    })
  })
  it('con peso corporal: una rep más, o lastre al llegar al máximo', () => {
    expect(suggestFor({ ...plan, pesoCorporal: true, ultima: [serie(0, 8)] }).reps).toBe('9')
    expect(suggestFor({ ...plan, pesoCorporal: true, ultima: [serie(null, 10)] })).toMatchObject({
      reps: '10+',
      tendencia: 'sube',
    })
  })
  it('sin última vez: con el 1RM de otra sesión o, si no, primera vez', () => {
    expect(suggestFor({ ...plan, ultima: null, mejorOtraSesion: 84 })).toMatchObject({
      kg: 65,
      tendencia: 'estimado',
    })
    expect(suggestFor({ ...plan, ultima: [] })).toEqual({
      kg: null,
      reps: '6–10',
      tendencia: 'nuevo',
      porque: 'Primera vez: elige un peso con el que hagas 6–10 reps RIR 2.',
    })
  })
})
