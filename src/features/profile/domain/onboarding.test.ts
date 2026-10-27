import { describe, expect, it } from 'vitest'
import {
  buildProfile,
  clampDays,
  daysFor,
  DEFAULT_ANSWERS,
  isValidAnswers,
  PHASE_LABELS,
  phaseOf,
} from './onboarding.ts'

describe('bienvenida', () => {
  it('las respuestas por defecto son las marcadas en el diseño', () => {
    expect(DEFAULT_ANSWERS).toEqual({ goal: 'gain_muscle', level: 'beginner', daysPerWeek: 3 })
    expect(isValidAnswers(DEFAULT_ANSWERS)).toBe(true)
  })

  it('crea el perfil con las respuestas', () => {
    const profile = buildProfile(
      { goal: 'lose_fat', level: 'advanced', daysPerWeek: 5 },
      new Date('2026-10-27T10:00:00Z'),
    )
    expect(profile).toEqual({
      id: 'me',
      goal: 'lose_fat',
      level: 'advanced',
      daysPerWeek: 5,
      equipment: 'gym_full',
      createdAt: '2026-10-27T10:00:00.000Z',
      updatedAt: '2026-10-27T10:00:00.000Z',
      deletedAt: null,
    })
  })

  it('cada objetivo marca su fase: volumen, definición o mantenimiento', () => {
    expect(phaseOf('gain_muscle')).toBe('bulk')
    expect(phaseOf('lose_fat')).toBe('cut')
    expect(phaseOf('feel_better')).toBe('maintenance')
    expect(PHASE_LABELS[phaseOf('feel_better')]).toBe('Mantenimiento')
  })

  it('principiante: como mucho 5 días; al pasar a principiante, 6 baja a 5', () => {
    expect(daysFor('beginner')).toEqual([2, 3, 4, 5])
    expect(daysFor('intermediate')).toEqual([2, 3, 4, 5, 6])
    expect(clampDays({ goal: 'gain_muscle', level: 'beginner', daysPerWeek: 6 }).daysPerWeek).toBe(5)
    expect(clampDays({ goal: 'gain_muscle', level: 'beginner', daysPerWeek: 3 }).daysPerWeek).toBe(3)
  })

  it('rechaza días fuera de 2 a 6', () => {
    expect(isValidAnswers({ ...DEFAULT_ANSWERS, daysPerWeek: 7 })).toBe(false)
    expect(() => buildProfile({ ...DEFAULT_ANSWERS, daysPerWeek: 1 })).toThrow()
  })
})
