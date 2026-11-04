import { describe, expect, it } from 'vitest'
import { DISCOS, discosPorLado, faseCadencia } from './workoutTools.ts'

describe('discosPorLado', () => {
  it('reparte el peso que falta entre los dos lados, de mayor a menor', () => {
    expect(discosPorLado(62.5, 20)).toEqual({ discos: [20, 1.25], sobra: 0 })
    expect(discosPorLado(100, 20)).toEqual({ discos: [25, 15], sobra: 0 })
    expect(discosPorLado(60, 0)).toEqual({ discos: [25, 5], sobra: 0 })
  })

  it('sin peso de más no hay discos, y lo que no cabe sale como sobra', () => {
    expect(discosPorLado(20, 20)).toEqual({ discos: [], sobra: 0 })
    expect(discosPorLado(15, 20)).toEqual({ discos: [], sobra: 0 })
    expect(discosPorLado(21, 20)).toEqual({ discos: [], sobra: 0.5 })
  })

  it('solo con los discos que hay en tu gimnasio, los menos posibles', () => {
    expect(discosPorLado(100, 20, [25])).toEqual({ discos: [20, 20], sobra: 0 })
    // Sin 20, 10 ni 5: dos de 15 mejor que 25 + 2,5 + 2,5
    expect(discosPorLado(80, 20, [20, 10, 5])).toEqual({ discos: [15, 15], sobra: 0 })
    expect(discosPorLado(62.5, 20, [1.25])).toEqual({ discos: [20], sobra: 1.25 })
    expect(discosPorLado(60, 20, [...DISCOS])).toEqual({ discos: [], sobra: 20 })
  })
})

describe('faseCadencia', () => {
  it('cuenta repeticiones y dice la fase en 3-1-1', () => {
    expect(faseCadencia(0, '3-1-1')).toEqual({ reps: 0, fase: 'Baja', avance: 0 })
    expect(faseCadencia(3.5, '3-1-1').fase).toBe('Pausa')
    expect(faseCadencia(4.5, '3-1-1').fase).toBe('Sube')
    expect(faseCadencia(10.5, '3-1-1')).toEqual({ reps: 2, fase: 'Baja', avance: 0.1 })
  })

  it('sin pausa pasa de bajar a subir', () => {
    expect(faseCadencia(3.2, '3-0-1').fase).toBe('Sube')
  })
})
