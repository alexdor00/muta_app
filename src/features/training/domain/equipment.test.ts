import { describe, expect, it } from 'vitest'
import { cambiarMaterial, loTienes, porMaterial } from './equipment.ts'

describe('tu material', () => {
  it('sin elegir nada lo tienes todo; el peso corporal y lo desconocido, siempre', () => {
    expect(loTienes('machine', [])).toBe(true)
    expect(loTienes('machine', ['machine'])).toBe(false)
    expect(loTienes('bodyweight', ['machine', 'cable'])).toBe(true)
    expect(loTienes(null, ['machine'])).toBe(true)
  })

  it('lo que no tienes va al final, cada parte en su orden', () => {
    const lista = [
      { n: 'Curl femoral', m: 'machine' as const },
      { n: 'Peso muerto rumano', m: 'barbell' as const },
      { n: 'Pull-through', m: 'cable' as const },
      { n: 'Buenos días', m: 'barbell' as const },
    ]
    const r = porMaterial(lista, (x) => x.m, ['machine', 'cable'])
    expect(r.tienes.map((x) => x.n)).toEqual(['Peso muerto rumano', 'Buenos días'])
    expect(r.noTienes.map((x) => x.n)).toEqual(['Curl femoral', 'Pull-through'])
  })

  it('poner y quitar un material', () => {
    expect(cambiarMaterial([], 'machine', false)).toEqual(['machine'])
    expect(cambiarMaterial(['machine', 'cable'], 'machine', true)).toEqual(['cable'])
    expect(cambiarMaterial(['machine'], 'machine', false)).toEqual(['machine'])
  })
})
