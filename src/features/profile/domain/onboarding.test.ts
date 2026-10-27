import { describe, expect, it } from 'vitest'
import { buildProfile, DEFAULT_ANSWERS, isValidAnswers } from './onboarding.ts'

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

  it('rechaza días fuera de 2 a 6', () => {
    expect(isValidAnswers({ ...DEFAULT_ANSWERS, daysPerWeek: 7 })).toBe(false)
    expect(() => buildProfile({ ...DEFAULT_ANSWERS, daysPerWeek: 1 })).toThrow()
  })
})
