import { describe, expect, it } from 'vitest'
import { misConsejos, SIN_AJUSTES } from './myTips.ts'

const BASE = [
  { text: 'Uno', why: 'Porque uno' },
  { text: 'Dos', why: 'Porque dos' },
]

describe('misConsejos', () => {
  it('sin ocultar nada, todos con su clave por su puesto', () => {
    expect(misConsejos(BASE, SIN_AJUSTES).map((c) => [c.clave, c.text, c.oculto])).toEqual([
      ['b0', 'Uno', false],
      ['b1', 'Dos', false],
    ])
  })
  it('los ocultos, marcados', () => {
    expect(misConsejos(BASE, { ocultos: ['b1'] }).map((c) => c.oculto)).toEqual([false, true])
  })
})
