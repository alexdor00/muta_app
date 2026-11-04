import { describe, expect, it } from 'vitest'
import { sinClaves } from './object.ts'

describe('sinClaves', () => {
  it('quita esas claves y deja el original como estaba', () => {
    const o = { a: 1, b: 2, c: 3 }
    expect(sinClaves(o, ['a', 'c'])).toEqual({ b: 2 })
    expect(o).toEqual({ a: 1, b: 2, c: 3 })
  })
})
