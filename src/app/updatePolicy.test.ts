import { describe, expect, it } from 'vitest'
import { shouldApplyUpdate } from './updatePolicy.ts'

describe('shouldApplyUpdate', () => {
  it('se aplica al abrir la app o al tocar Actualizar', () => {
    expect(shouldApplyUpdate('open', false)).toBe(true)
    expect(shouldApplyUpdate('userTapped', false)).toBe(true)
  })

  it('mientras usas la app solo se avisa, no se recarga', () => {
    expect(shouldApplyUpdate('whileUsing', false)).toBe(false)
  })

  it('con un entreno en curso no se aplica nunca', () => {
    expect(shouldApplyUpdate('open', true)).toBe(false)
    expect(shouldApplyUpdate('userTapped', true)).toBe(false)
    expect(shouldApplyUpdate('whileUsing', true)).toBe(false)
  })
})
