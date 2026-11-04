import { describe, expect, it } from 'vitest'
import { misConsejos, SIN_AJUSTES } from './myTips.ts'

const BASE = [
  { text: 'Uno', why: 'Porque uno' },
  { text: 'Dos', why: 'Porque dos' },
]

describe('misConsejos', () => {
  it('sin cambios, los de MUTA tal cual', () => {
    expect(misConsejos(BASE, SIN_AJUSTES).map((c) => [c.clave, c.text, c.oculto, c.editado])).toEqual([
      ['b0', 'Uno', false, false],
      ['b1', 'Dos', false, false],
    ])
  })
  it('ocultos marcados, texto cambiado y los tuyos detrás', () => {
    const lista = misConsejos(BASE, {
      ocultos: ['b0'],
      editados: { b1: 'Dos, a mi manera', p1: 'Mío cambiado' },
      propios: [{ clave: 'p1', text: 'Mío' }],
    })
    expect(lista.map((c) => [c.clave, c.text, c.why, c.propio, c.oculto, c.editado])).toEqual([
      ['b0', 'Uno', 'Porque uno', false, true, false],
      ['b1', 'Dos, a mi manera', 'Porque dos', false, false, true],
      ['p1', 'Mío cambiado', '', true, false, false],
    ])
  })
})
