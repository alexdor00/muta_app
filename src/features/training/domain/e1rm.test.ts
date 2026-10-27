import { describe, expect, it } from 'vitest'
import { e1rm } from './e1rm.ts'

describe('e1rm', () => {
  it('con kilos usa kg × (1 + (reps + RIR) / 30)', () => {
    expect(e1rm(60, 10, 2)).toBeCloseTo(84)
    expect(e1rm(100, 5, 0)).toBeCloseTo(116.667, 3)
  })

  it('sin kilos (peso corporal) es reps + RIR', () => {
    expect(e1rm(null, 12, 1)).toBe(13)
    expect(e1rm(0, 8, 2)).toBe(10)
  })
})
