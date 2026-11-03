import { describe, expect, it } from 'vitest'
import { planCalentamiento, rampa, type EjercicioACalentar } from './warmup.ts'

const base: EjercicioACalentar = {
  musculo: 'femoral',
  secundarios: [],
  compuesto: true,
  pesoCorporal: false,
  kilos: 62.5,
  salto: 2.5,
}

describe('rampa', () => {
  it('básico de músculo grande con 30 kg o más: 50 % × 8, 70 % × 5, 85 % × 3', () => {
    expect(rampa(base)).toEqual([
      [0.5, 8],
      [0.7, 5],
      [0.85, 3],
    ])
  })

  it('con poco peso, músculo grande o básico: dos series; aislamiento pequeño: una; peso corporal: ninguna', () => {
    expect(rampa({ ...base, kilos: 24 })).toHaveLength(2)
    expect(rampa({ ...base, musculo: 'hombro_lat', compuesto: false })).toHaveLength(2)
    expect(rampa({ ...base, musculo: 'biceps', compuesto: false })).toEqual([[0.6, 10]])
    expect(rampa({ ...base, pesoCorporal: true })).toBeNull()
  })
})

describe('planCalentamiento', () => {
  it('calcula los kilos redondeando al salto (peso muerto rumano con 62,5 kg)', () => {
    expect(planCalentamiento([base])).toEqual([
      [
        { kilos: 30, reps: 8 },
        { kilos: 42.5, reps: 5 },
        { kilos: 52.5, reps: 3 },
      ],
    ])
  })

  it('solo calienta el primer ejercicio de cada músculo, contando los secundarios', () => {
    const plan = planCalentamiento([
      { ...base, secundarios: ['gluteo'] },
      { ...base, musculo: 'femoral', compuesto: false, kilos: 40 },
      { ...base, musculo: 'gluteo', kilos: 80 },
      { ...base, musculo: 'pecho', kilos: 24, salto: 2 },
    ])
    expect(plan[1]).toBeNull()
    expect(plan[2]).toBeNull()
    expect(plan[3]).toEqual([
      { kilos: 12, reps: 10 },
      { kilos: 18, reps: 5 },
    ])
  })

  it('quita los kilos que salen 0, repetidos o iguales al peso de trabajo, y sin peso no hay plan', () => {
    expect(planCalentamiento([{ ...base, musculo: 'biceps', compuesto: false, kilos: 2, salto: 2 }])).toEqual(
      [null],
    )
    expect(planCalentamiento([{ ...base, kilos: null }])).toEqual([null])
  })

  it('sin músculo conocido se calienta siempre, como un músculo pequeño', () => {
    const plan = planCalentamiento([
      { ...base, musculo: null, compuesto: false, kilos: 40 },
      { ...base, musculo: null, compuesto: false, kilos: 40 },
    ])
    expect(plan).toEqual([[{ kilos: 22.5, reps: 10 }], [{ kilos: 22.5, reps: 10 }]])
  })
})
