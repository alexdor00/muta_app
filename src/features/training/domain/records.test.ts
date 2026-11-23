import { describe, expect, it } from 'vitest'
import { mejorDeSiempre, recordsDelDia, recordsDelEntreno, serieRecord } from './records.ts'
import type { Entreno } from './workoutHistory.ts'

const entreno = (id: string, fecha: string, inicio: number, kg: number, reps: number): Entreno => ({
  id,
  fecha,
  inicio,
  segundos: 3600,
  sigla: 'A1',
  nombre: 'A1',
  programId: 'p',
  ejercicios: [{ nombre: 'Sentadilla hack', musculo: 'cuadriceps', puesto: 1, series: [{ kg, reps }] }],
})

describe('récords', () => {
  const antes = [entreno('a', '2026-11-02', 1, 95, 8), entreno('b', '2026-11-09', 2, 97.5, 7)]

  it('tu mejor de siempre es el mayor 1RM estimado; 0 si nunca', () => {
    expect(mejorDeSiempre(antes, 'Sentadilla hack')).toBeCloseTo(95 * (1 + 8 / 30))
    expect(mejorDeSiempre(antes, 'Remo')).toBe(0)
  })

  it('la serie récord es la mejor de hoy si supera tu mejor de siempre', () => {
    const mejor = mejorDeSiempre(antes, 'Sentadilla hack')
    expect(
      serieRecord(
        [
          { kg: 95, reps: 8 },
          { kg: 100, reps: 8 },
          { kg: 97.5, reps: 8 },
        ],
        mejor,
      ),
    ).toBe(1)
    expect(serieRecord([{ kg: 95, reps: 8 }], mejor)).toBe(-1)
    expect(serieRecord([null, { kg: 100, reps: 8 }], mejor)).toBe(1)
  })

  it('la primera vez no es récord', () => {
    expect(serieRecord([{ kg: 100, reps: 8 }], 0)).toBe(-1)
  })

  it('los récords de un entreno y de un día, frente a todo lo anterior', () => {
    const hoy = entreno('c', '2026-11-20', 3, 100, 8)
    const todos = [...antes, hoy]
    expect(recordsDelEntreno(hoy, todos)).toEqual([
      { nombre: 'Sentadilla hack', serie: { kg: 100, reps: 8 }, e1rm: 126.7 },
    ])
    expect(recordsDelDia('2026-11-20', todos)).toHaveLength(1)
    expect(recordsDelDia('2026-11-09', todos)).toHaveLength(0)
  })
})
