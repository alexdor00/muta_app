import { describe, expect, it } from 'vitest'
import { resumenSesion } from './workoutSummary.ts'

const rumano = {
  nombre: 'Peso muerto rumano',
  hechas: [
    { kg: 62.5, reps: 6 },
    { kg: 62.5, reps: 9 },
  ],
  antes: [
    { kg: 60, reps: 10 },
    { kg: 62.5, reps: 6 },
  ],
}
const press = { nombre: 'Press inclinado', hechas: [{ kg: 22, reps: 10 }], antes: [{ kg: 24, reps: 12 }] }

describe('resumenSesion', () => {
  it('compara la mejor serie de hoy con la mejor de la vez anterior por su 1RM estimado', () => {
    const r = resumenSesion([rumano])
    expect(r.ejercicios[0].mejor).toEqual({ kg: 62.5, reps: 9 })
    expect(r.ejercicios[0].mejorAntes).toEqual({ kg: 60, reps: 10 })
    // 62,5 × (1 + 9/30) frente a 60 × (1 + 10/30)
    expect(r.ejercicios[0].cambio).toBeCloseTo((62.5 * (39 / 30)) / (60 * (40 / 30)) - 1, 5)
  })

  it('récords y «suben» son los que mejoran; la mejor serie es la de más 1RM', () => {
    const r = resumenSesion([rumano, press])
    expect(r.records.map((e) => e.nombre)).toEqual(['Peso muerto rumano'])
    expect(r.suben).toBe(1)
    expect(r.comparados).toBe(2)
    expect(r.mejorSerie).toEqual({ nombre: 'Peso muerto rumano', serie: { kg: 62.5, reps: 9 } })
  })

  it('suma volumen, series y repeticiones; deja fuera lo no hecho y no compara sin vez anterior', () => {
    const r = resumenSesion([
      rumano,
      { nombre: 'Nada', hechas: [], antes: [{ kg: 10, reps: 10 }] },
      { nombre: 'Nuevo', hechas: [{ kg: 10, reps: 10 }], antes: [] },
    ])
    expect(r.volumen).toBe(62.5 * 15 + 100)
    expect(r.series).toBe(3)
    expect(r.reps).toBe(25)
    expect(r.ejercicios.map((e) => e.nombre)).toEqual(['Peso muerto rumano', 'Nuevo'])
    expect(r.ejercicios[1].cambio).toBeNull()
  })

  it('marca las series que superan la misma serie de la vez anterior y las cuenta', () => {
    const r = resumenSesion([rumano])
    expect(r.ejercicios[0].series.map((s) => s.mejor)).toEqual([false, true])
    expect(r.superadas).toBe(1)
    expect(r.comparables).toBe(2)
  })
})
