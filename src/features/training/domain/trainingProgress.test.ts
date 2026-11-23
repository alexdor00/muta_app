import { describe, expect, it } from 'vitest'
import { lunesDe } from './trainingProgress.ts'

describe('lunesDe', () => {
  it('el lunes de la semana de un día', () => {
    expect(lunesDe('2026-11-09')).toBe('2026-11-09')
    expect(lunesDe('2026-11-15')).toBe('2026-11-09')
  })
})
