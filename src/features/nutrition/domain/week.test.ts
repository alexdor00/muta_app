import { describe, expect, it } from 'vitest'
import { letraDia } from './week.ts'

describe('letraDia', () => {
  it('la letra de cada día, de lunes a domingo', () => {
    const semana = [
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]
    expect(semana.map(letraDia)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D'])
  })
})
