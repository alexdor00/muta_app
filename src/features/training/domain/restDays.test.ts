import { describe, expect, it } from 'vitest'
import type { Day } from './program.ts'
import {
  descansosDeRutina,
  descansosPendientes,
  descansosPorSesion,
  hoyTocaDescanso,
  trasDe,
} from './restDays.ts'

const S = (name: string): Day => ({ name, exercises: [] })
const R: Day = { rest: true }

describe('descansosDeRutina', () => {
  it('los días de descanso del archivo, tras su sesión (uno al principio, al final)', () => {
    expect(descansosDeRutina([S('A'), R, S('B'), R], [[], []])).toEqual([1, 2])
    expect(descansosDeRutina([R, S('A'), S('B')], [[], []])).toEqual([2])
    expect(descansosDeRutina([S('A'), R, R, S('B')], [[], []])).toEqual([1, 1])
  })
  it('sin descansos en el archivo: los del documento para esa fase', () => {
    const rules = [
      { after: 2, note: 'x' },
      { after: 3, note: 'y', phase: 1 },
    ]
    expect(descansosDeRutina([S('A'), S('B'), S('C')], [[], [], []], rules, 0)).toEqual([2])
    expect(descansosDeRutina([S('A'), S('B'), S('C')], [[], [], []], rules, 1)).toEqual([2, 3])
  })
  it('si nadie dice nada, al completar la vuelta al cuerpo', () => {
    const torso = ['pecho', 'dorsal'] as const
    const pierna = ['cuadriceps', 'femoral'] as const
    expect(
      descansosDeRutina([S('T'), S('P'), S('T'), S('P')], [[...torso], [...pierna], [...torso], [...pierna]]),
    ).toEqual([2, 4])
  })
})

describe('descansosPorSesion y trasDe', () => {
  it('van y vuelven', () => {
    expect(descansosPorSesion([1, 3, 3], 4)).toEqual([1, 0, 2, 0])
    expect(trasDe([1, 0, 2, 0])).toEqual([1, 3, 3])
  })
})

describe('hoyTocaDescanso', () => {
  it('tras una sesión con descanso, el día siguiente; con dos, también el otro', () => {
    expect(hoyTocaDescanso([2], 2, 1)).toBe(true)
    expect(hoyTocaDescanso([2], 2, 2)).toBe(false)
    expect(hoyTocaDescanso([2, 2], 2, 2)).toBe(true)
  })
  it('no si la sesión no lleva descanso, si entrenaste hoy o si no hay entrenos', () => {
    expect(hoyTocaDescanso([2], 1, 1)).toBe(false)
    expect(hoyTocaDescanso([2], 2, 0)).toBe(false)
    expect(hoyTocaDescanso([2], null, null)).toBe(false)
  })
})

describe('descansosPendientes', () => {
  it('entrenaste hoy: todos los de esa sesión; ayer: los que quedan, contando hoy', () => {
    expect(descansosPendientes([2, 2], 2, 0)).toBe(2)
    expect(descansosPendientes([2, 2], 2, 1)).toBe(2)
    expect(descansosPendientes([2, 2], 2, 2)).toBe(1)
    expect(descansosPendientes([2], 2, 3)).toBe(0)
    expect(descansosPendientes([2], 1, 1)).toBe(0)
    expect(descansosPendientes([2], null, null)).toBe(0)
  })
})
