import { describe, expect, it } from 'vitest'
import { isSession, type Day } from './program.ts'

describe('días de un programa', () => {
  it('distingue una sesión de un día de descanso', () => {
    const session: Day = { name: 'Torso', exercises: [] }
    const rest: Day = { rest: true, note: 'Descanso' }
    expect(isSession(session)).toBe(true)
    expect(isSession(rest)).toBe(false)
  })
})
