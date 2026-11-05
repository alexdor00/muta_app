import { describe, expect, it } from 'vitest'
import { fuerzaEnBasicos } from './strengthTrend.ts'
import type { Entreno } from './workoutHistory.ts'

const entreno = (fecha: string, ejercicios: [string, number, number][]): Entreno => ({
  id: fecha,
  fecha,
  inicio: Date.parse(fecha),
  segundos: 3600,
  sigla: 'A1',
  nombre: 'A1',
  programId: 'p',
  ejercicios: ejercicios.map(([nombre, kg, reps], i) => ({
    nombre,
    musculo: null,
    series: [{ kg, reps }],
    puesto: i + 1,
  })),
})

const compuestos = new Set(['Sentadilla', 'Press banca', 'Remo', 'Peso muerto'])
const esCompuesto = (n: string) => compuestos.has(n)

describe('fuerza en los básicos', () => {
  it('compara las 2 últimas semanas con las 2 anteriores en los 3 compuestos más repetidos', () => {
    const entrenos = [
      entreno('2026-10-10', [
        ['Sentadilla', 100, 5],
        ['Press banca', 80, 5],
        ['Curl', 20, 10],
      ]),
      entreno('2026-10-14', [['Sentadilla', 100, 5]]),
      entreno('2026-10-25', [
        ['Sentadilla', 97, 5],
        ['Press banca', 77.6, 5],
        ['Curl', 25, 10],
      ]),
      entreno('2026-11-01', [['Sentadilla', 96, 5]]),
    ]
    const r = fuerzaEnBasicos(entrenos, '2026-11-05', esCompuesto)
    expect(r?.ejercicios.map((e) => e.nombre)).toEqual(['Sentadilla', 'Press banca'])
    // Sentadilla −3 %, press −3 %: el curl no cuenta (no es compuesto)
    expect(r?.cambio).toBeCloseTo(-0.03, 3)
  })

  it('sin series en los dos tramos no hay comparación', () => {
    expect(fuerzaEnBasicos([entreno('2026-11-01', [['Remo', 60, 8]])], '2026-11-05', esCompuesto)).toBeNull()
  })
})
