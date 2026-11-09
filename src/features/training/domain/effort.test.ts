import { describe, expect, it } from 'vitest'
import { effortLabel, esfuerzoApuntado, plainEffort, rirProgresivo } from './effort.ts'

describe('effortLabel', () => {
  it('siempre en RIR: RIR 0 no es «al fallo»', () => {
    expect(effortLabel(0)).toBe('RIR 0')
    expect(effortLabel(2)).toBe('RIR 2')
  })
})

describe('plainEffort', () => {
  it('deja la sigla RIR delante y no traduce a «del fallo»', () => {
    expect(plainEffort('Baja sin rebotar. RIR 1–2: es libre y técnico.')).toBe(
      'Baja sin rebotar. RIR 1–2: es libre y técnico.',
    )
    expect(plainEffort('Entre 8 y 20 repeticiones y 0–3 RIR; en máquina…')).toBe(
      'Entre 8 y 20 repeticiones y RIR 0–3; en máquina…',
    )
    expect(plainEffort('Cerca del fallo (RIR 1–2).')).toBe('Cerca del fallo (RIR 1–2).')
  })
})

describe('rirProgresivo', () => {
  it('la primera semana solo la última serie va al RIR de la rutina; cada semana, una más', () => {
    expect(rirProgresivo(1, 3, 0)).toEqual([2, 2, 1])
    expect(rirProgresivo(1, 3, 1)).toEqual([2, 1, 1])
    expect(rirProgresivo(1, 3, 5)).toEqual([1, 1, 1])
    expect(rirProgresivo(0, 2)).toEqual([1, 0])
    expect(rirProgresivo(5, 2)).toEqual([5, 5])
  })
})

describe('esfuerzoApuntado', () => {
  it('RIR escrito, fallo con «F» y nada si está vacío', () => {
    expect(esfuerzoApuntado('2')).toEqual({ rir: 2 })
    expect(esfuerzoApuntado('F')).toEqual({ rir: 0, fallo: true })
    expect(esfuerzoApuntado('')).toEqual({})
  })
})
