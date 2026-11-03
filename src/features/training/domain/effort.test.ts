import { describe, expect, it } from 'vitest'
import { effortLabel, plainEffort } from './effort.ts'

describe('effortLabel', () => {
  it('RIR 0 es «al fallo»', () => {
    expect(effortLabel(0)).toBe('al fallo')
  })

  it('con repeticiones en reserva, «a N del fallo»', () => {
    expect(effortLabel(1)).toBe('a 1 del fallo')
    expect(effortLabel(2)).toBe('a 2 del fallo')
  })
})

describe('plainEffort', () => {
  it('cambia la sigla por palabras, con mayúscula al empezar frase', () => {
    expect(plainEffort('Baja sin rebotar. RIR 1–2: es libre y técnico.')).toBe(
      'Baja sin rebotar. A 1–2 del fallo: es libre y técnico.',
    )
    expect(plainEffort('Exigente: RIR 2–3 por su coste.')).toBe('Exigente: A 2–3 del fallo por su coste.')
    expect(plainEffort('Cuádriceps; RIR 0 en la última.')).toBe('Cuádriceps; al fallo en la última.')
    expect(plainEffort('Sin sigla.')).toBe('Sin sigla.')
  })
  it('también «a RIR 0 o fallo» y «0–3 RIR» (consejos de músculos)', () => {
    expect(plainEffort('De 2 series a RIR 0 o fallo.')).toBe('De 2 series al fallo.')
    expect(plainEffort('Entre 8 y 20 repeticiones y 0–3 RIR; en máquina…')).toBe(
      'Entre 8 y 20 repeticiones y a 0–3 del fallo; en máquina…',
    )
    expect(plainEffort('Cerca del fallo (RIR 1–2).')).toBe('Cerca del fallo (a 1–2 del fallo).')
  })
})
