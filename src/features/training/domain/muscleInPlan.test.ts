import { describe, expect, it } from 'vitest'
import { barMax, muscleInPlan, stepRange, verdict, type HuecoPlan } from './muscleInPlan.ts'

const h = (
  nombre: string,
  sigla: string,
  series: number,
  contributes: HuecoPlan['contributes'],
): HuecoPlan => ({
  id: nombre,
  nombre,
  sigla,
  series,
  contributes,
})

describe('muscleInPlan', () => {
  it('cuentan las series de los que lo trabajan directo; los de 0,5 a menos de 1 van aparte y no suman', () => {
    const semana = [
      h('Hip thrust', 'B2', 4, { gluteo: 1 }),
      h('Peso muerto rumano', 'B1', 3, { femoral: 1, gluteo: 0.75 }),
      h('Prensa', 'A1', 3, { cuadriceps: 1, gluteo: 0.5 }),
      h('Crunch', 'B1', 2, { core: 1, gluteo: 0.25 }),
    ]
    const g = muscleInPlan(semana, 'gluteo')
    expect(g.series).toBe(4)
    expect(g.directos.map((x) => x.nombre)).toEqual(['Hip thrust'])
    expect(g.indirectos.map((x) => x.nombre)).toEqual(['Peso muerto rumano', 'Prensa'])
  })
})

describe('barMax', () => {
  it('20 como poco; si no, hueco para el máximo y para lo que hace el plan', () => {
    expect(barMax([6, 12], 4)).toBe(20)
    expect(barMax([10, 20], 4)).toBe(30)
    expect(barMax([6, 12], 25)).toBe(28)
  })
})

describe('verdict', () => {
  it('falta, se pasa, va bien o no hay ninguno', () => {
    expect(verdict(4, [6, 12])).toBe('Te faltan 2 series')
    expect(verdict(5, [6, 12])).toBe('Te falta 1 serie')
    expect(verdict(14, [6, 12])).toBe('Te pasas 2 series')
    expect(verdict(8, [6, 12])).toBe('Vas bien')
    expect(verdict(0, [6, 12])).toBe('Ningún ejercicio de tu plan lo trabaja directamente')
  })
})

describe('stepRange', () => {
  it('de 0 a 40 y sin cruzarse', () => {
    expect(stepRange([6, 12], 0, 1)).toEqual([7, 12])
    expect(stepRange([6, 6], 0, 1)).toEqual([7, 7])
    expect(stepRange([6, 6], 1, -1)).toEqual([5, 5])
    expect(stepRange([0, 40], 0, -1)).toEqual([0, 40])
    expect(stepRange([0, 40], 1, 1)).toEqual([0, 40])
  })
})
