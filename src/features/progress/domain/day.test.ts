import { describe, expect, it } from 'vitest'
import { laVezAnterior } from './day.ts'

const entreno = (fecha: string, nombre: string, kg: number) => ({
  fecha,
  ejercicios: [{ nombre, series: [{ kg, reps: 8 }] }],
})

describe('un día de entreno', () => {
  it('la vez anterior: el último día de antes con ese ejercicio', () => {
    const lista = [
      entreno('2026-10-20', 'Remo', 65),
      entreno('2026-10-27', 'Prensa', 160),
      entreno('2026-10-24', 'Remo', 67.5),
      entreno('2026-10-29', 'Remo', 67.5),
    ]
    expect(laVezAnterior(lista, 'Remo', '2026-10-29')).toEqual({
      fecha: '2026-10-24',
      series: [{ kg: 67.5, reps: 8 }],
    })
    expect(laVezAnterior(lista, 'Remo', '2026-10-20')).toBeNull()
    expect(laVezAnterior(lista, 'Sentadilla', '2026-10-29')).toBeNull()
  })
})
