import { describe, expect, it } from 'vitest'
import { effortLabel } from './effort.ts'

describe('effortLabel', () => {
  it('RIR 0 es «al fallo»', () => {
    expect(effortLabel(0)).toBe('al fallo')
  })

  it('con repeticiones en reserva, «a N del fallo»', () => {
    expect(effortLabel(1)).toBe('a 1 del fallo')
    expect(effortLabel(2)).toBe('a 2 del fallo')
  })
})
