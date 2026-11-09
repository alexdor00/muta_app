import { describe, expect, it } from 'vitest'
import { rendimientoReciente } from './rendimiento.ts'
import type { Entreno } from './workoutHistory.ts'

const entreno = (fecha: string, inicio: number, kg: number): Entreno => ({
  id: fecha,
  fecha,
  inicio,
  segundos: 3600,
  sigla: 'A1',
  nombre: 'A1',
  programId: 'p',
  ejercicios: [
    { nombre: 'Prensa', musculo: 'cuadriceps', puesto: 1, series: [1, 2, 3].map(() => ({ kg, reps: 10 })) },
  ],
})

describe('rendimientoReciente', () => {
  it('cuenta las sesiones que van peor en los últimos 10 días y en las semanas de antes', () => {
    const entrenos = [
      entreno('2026-10-14', 1, 100),
      entreno('2026-10-21', 2, 102.5),
      entreno('2026-10-28', 3, 102.5),
      entreno('2026-11-03', 4, 97.5),
      entreno('2026-11-07', 5, 95),
    ]
    expect(rendimientoReciente(entrenos, '2026-11-09')).toEqual({
      peoresRecientes: 2,
      recientes: 2,
      peoresAntes: 0,
      antes: 2,
    })
  })
})
