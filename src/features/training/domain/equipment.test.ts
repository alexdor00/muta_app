import { describe, expect, it } from 'vitest'
import { cambiarMaterial } from './equipment.ts'

describe('los discos de tu gimnasio', () => {
  it('quitar y volver a poner un disco de lo que falta', () => {
    expect(cambiarMaterial([5], 2.5, false)).toEqual([5, 2.5])
    expect(cambiarMaterial([5, 2.5], 2.5, true)).toEqual([5])
    expect(cambiarMaterial([5], 5, false)).toEqual([5])
  })
})
