import { describe, expect, it } from 'vitest'
import { effortLabel, plainEffort } from './effort.ts'

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
