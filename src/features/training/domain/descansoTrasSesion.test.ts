import { describe, expect, it } from 'vitest'
import { descansoTrasSesion } from './descansoTrasSesion.ts'

const base = {
  nombre: 'Press militar',
  series: [
    { kg: 73, reps: 10, rir: 1 },
    { kg: 73, reps: 7, rir: 1 },
  ],
  descanso: 150,
  descansoPlan: 150,
  compuesto: true,
  repsMax: 12,
  larga: false,
}

describe('descansoTrasSesion (02-reglas § 3)', () => {
  it('la 2.ª serie cae por debajo del 80 %: +45 s, con su motivo', () => {
    expect(descansoTrasSesion(base)).toEqual({
      nombre: 'Press militar',
      de: 150,
      a: 195,
      motivo: 'Bajaste de 10 a 7 repeticiones en la 2.ª serie.',
    })
  })

  it('nunca más de 2 min sobre el del plan; si ya está en el tope, nada', () => {
    expect(descansoTrasSesion({ ...base, descanso: 255 })?.a).toBe(270)
    expect(descansoTrasSesion({ ...base, descanso: 270 })).toBeNull()
  })

  it('solo compara con el mismo peso y un RIR parecido', () => {
    const otroPeso = [base.series[0], { kg: 80, reps: 7, rir: 1 }]
    expect(descansoTrasSesion({ ...base, series: otroPeso })).toBeNull()
    const otroRir = [base.series[0], { kg: 73, reps: 7, rir: 3 }]
    expect(descansoTrasSesion({ ...base, series: otroRir })).toBeNull()
    const sinRir = [
      { kg: 73, reps: 10 },
      { kg: 73, reps: 7 },
    ]
    expect(descansoTrasSesion({ ...base, series: sinRir })?.a).toBe(195)
  })

  it('mantienes las repeticiones y la sesión se alargó: −15 s, sin bajar del mínimo de su tipo', () => {
    const iguales = [
      { kg: 73, reps: 10, rir: 1 },
      { kg: 73, reps: 10, rir: 1 },
    ]
    expect(descansoTrasSesion({ ...base, series: iguales, larga: true })?.a).toBe(135)
    expect(descansoTrasSesion({ ...base, series: iguales, larga: true, descanso: 120 })).toBeNull()
    // Pesado (hasta 6 repeticiones): no baja de 150 s; aislamiento: de 60 s
    expect(descansoTrasSesion({ ...base, series: iguales, larga: true, repsMax: 6, descanso: 160 })?.a).toBe(
      150,
    )
    expect(
      descansoTrasSesion({ ...base, series: iguales, larga: true, compuesto: false, descanso: 70 })?.a,
    ).toBe(60)
    // Sin alargarse, no se toca
    expect(descansoTrasSesion({ ...base, series: iguales })).toBeNull()
  })

  it('con una sola serie, o en la zona de en medio (80–95 %), nada', () => {
    expect(descansoTrasSesion({ ...base, series: [base.series[0]] })).toBeNull()
    const medio = [
      { kg: 73, reps: 10, rir: 1 },
      { kg: 73, reps: 9, rir: 1 },
    ]
    expect(descansoTrasSesion({ ...base, series: medio, larga: true })).toBeNull()
    expect(descansoTrasSesion({ ...base, series: [{ kg: 73, reps: 0 }, base.series[1]] })).toBeNull()
  })
})
