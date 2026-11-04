import { describe, expect, it } from 'vitest'
import {
  avisoDeOrden,
  cambioDesdePrimera,
  progresoDe,
  type PuntoProgreso,
  cambioUltimaVez,
} from './exerciseProgress.ts'

describe('progresoDe', () => {
  it('máximo: el 1RM de la mejor serie (con el RIR del plan); volumen: kilos × reps', () => {
    const veces = [
      {
        fecha: '2026-10-23',
        series: [
          { kg: 60, reps: 10 },
          { kg: 62.5, reps: 6 },
        ],
      },
    ]
    // 60 × (1 + 12/30) = 84; 62,5 × (1 + 8/30) = 79,2
    expect(progresoDe(veces, 2)).toEqual([{ fecha: '2026-10-23', maximo: 84, volumen: 975, puesto: null }])
  })
  it('con peso corporal el máximo son reps + RIR y no suma volumen; las veces sin series no cuentan', () => {
    const veces = [
      { fecha: '2026-10-20', series: [{ kg: null, reps: 12 }] },
      { fecha: '2026-10-22', series: [{ kg: null, reps: 0 }] },
    ]
    expect(progresoDe(veces, 1)).toEqual([{ fecha: '2026-10-20', maximo: 13, volumen: 0, puesto: null }])
  })
})

describe('cambioDesdePrimera', () => {
  it('del primero al último', () => {
    expect(cambioDesdePrimera([80, 82, 84])).toBeCloseTo(0.05)
    expect(cambioDesdePrimera([80])).toBeNull()
    expect(cambioDesdePrimera([0, 5])).toBeNull()
  })
})

describe('avisoDeOrden', () => {
  const p = (puesto: number | null): PuntoProgreso => ({
    fecha: '2026-10-23',
    maximo: 80,
    volumen: 900,
    puesto,
  })
  it('avisa si la última vez y la anterior fueron en distinto puesto', () => {
    expect(avisoDeOrden([p(1), p(3), p(1)])).toEqual({ antes: 3, ahora: 1 })
    expect(avisoDeOrden([p(3), p(1), p(1)])).toBeNull()
  })
  it('sin saber el puesto, o con una sola vez, no avisa', () => {
    expect(avisoDeOrden([p(null), p(1)])).toBeNull()
    expect(avisoDeOrden([p(1)])).toBeNull()
  })
})

describe('cambioUltimaVez', () => {
  const vez = (fecha: string, kg: number | null, reps: number) => ({ fecha, series: [{ kg, reps }] })
  it('la última frente a la anterior, por el máximo estimado; sin peso, por las repeticiones', () => {
    expect(cambioUltimaVez([vez('a', 60, 10), vez('b', 60, 10)], 2)).toBe(0)
    expect(cambioUltimaVez([vez('a', 50, 10), vez('b', 60, 10), vez('c', 62.5, 10)], 2)).toBeCloseTo(
      0.0417,
      3,
    )
    expect(cambioUltimaVez([vez('a', null, 10), vez('b', null, 12)], 2)).toBeCloseTo(0.2)
  })
  it('null con una sola vez', () => {
    expect(cambioUltimaVez([vez('a', 60, 10)], 2)).toBeNull()
  })
})
