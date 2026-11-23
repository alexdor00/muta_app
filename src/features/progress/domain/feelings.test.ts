import { describe, expect, it } from 'vitest'
import { contestadas, resumenSensaciones } from './feelings.ts'

describe('¿Cómo estás hoy?', () => {
  it('cuenta las preguntas contestadas', () => {
    expect(contestadas(null)).toBe(0)
    expect(contestadas({ date: '2026-11-13', sueno: 1, estres: 0 })).toBe(2)
  })
  it('lo resume en una línea, solo con lo contestado', () => {
    expect(resumenSensaciones({ date: '2026-11-13', sueno: 1, hambre: 0, digestiones: 2 })).toBe(
      'Sueño 6–8 h · hambre poca · digestiones pesadas',
    )
    expect(resumenSensaciones({ date: '2026-11-13', energia: 2 })).toBe('Energía alta')
    expect(resumenSensaciones(undefined)).toBe('')
  })
})
