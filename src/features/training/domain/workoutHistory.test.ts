import { describe, expect, it } from 'vitest'
import {
  historialDe,
  progresoDeSesion,
  semanaDe,
  seriesPorMusculo,
  ultimaVez,
  type Entreno,
} from './workoutHistory.ts'
import type { SesionPlan } from './workoutPlan.ts'

const entreno = (fecha: string, sigla: string, kg: number, puesto = 1): Entreno => ({
  id: fecha,
  fecha,
  inicio: Date.parse(`${fecha}T18:00:00Z`),
  segundos: 3600,
  sigla,
  nombre: sigla,
  programId: 'p',
  ejercicios: [
    {
      nombre: 'Prensa',
      musculo: 'cuadriceps',
      puesto,
      series: [
        { kg, reps: 10 },
        { kg, reps: 8 },
      ],
    },
  ],
})

// Lunes 26 y martes 27 de octubre de 2026
const ENTRENOS = [
  entreno('2026-10-27', 'B1', 105, 2),
  entreno('2026-10-20', 'A1', 100),
  entreno('2026-10-26', 'A1', 102.5),
]

describe('historial', () => {
  it('la última vez de un ejercicio y cada vez que se hizo, en orden', () => {
    expect(ultimaVez(ENTRENOS, 'Prensa')).toEqual([
      { kg: 105, reps: 10 },
      { kg: 105, reps: 8 },
    ])
    expect(ultimaVez(ENTRENOS, 'Otro')).toEqual([])
    expect(historialDe(ENTRENOS, 'Prensa').map((v) => [v.fecha, v.puesto])).toEqual([
      ['2026-10-20', 1],
      ['2026-10-26', 1],
      ['2026-10-27', 2],
    ])
  })

  it('el progreso de una sesión: toneladas, repeticiones y minutos', () => {
    expect(progresoDeSesion(ENTRENOS, 'A1')).toEqual([
      { fecha: '2026-10-20', toneladas: 1.8, reps: 18, minutos: 60 },
      { fecha: '2026-10-26', toneladas: 1.8, reps: 18, minutos: 60 },
    ])
  })
})

describe('tu semana', () => {
  it('lo hecho, hoy con la que toca, lo pasado sin entrenar como descanso y lo que falta vacío', () => {
    expect(semanaDe(ENTRENOS.slice(1), '2026-10-28', 'B1', true)[2]).toMatchObject({
      sigla: '',
      estado: 'descanso',
    })
    const semana = semanaDe(ENTRENOS.slice(1), '2026-10-28', 'B1')
    expect(semana.map((d) => [d.letra, d.dia, d.sigla, d.estado])).toEqual([
      ['L', 26, 'A1', 'hecho'],
      ['M', 27, '', 'descanso'],
      ['X', 28, 'B1', 'hoy'],
      ['J', 29, '', 'pendiente'],
      ['V', 30, '', 'pendiente'],
      ['S', 31, '', 'pendiente'],
      ['D', 1, '', 'pendiente'],
    ])
  })

  it('series por músculo: hoy lo que toca y la semana lo hecho más lo de hoy', () => {
    const toca: SesionPlan = {
      sigla: 'B1',
      nombre: 'B1',
      minutos: 60,
      ejercicios: [
        { nombre: 'Press', series: 3, musculo: 'pecho' },
        { nombre: '¿?', series: 2, musculo: null },
      ] as SesionPlan['ejercicios'],
    }
    expect(seriesPorMusculo(ENTRENOS.slice(1), '2026-10-28', toca)).toEqual({
      hoy: { pecho: 3 },
      semana: { cuadriceps: 2, pecho: 3 },
    })
    // Ya entrenaste hoy: cuenta lo hecho, no lo que tocaba
    expect(seriesPorMusculo(ENTRENOS, '2026-10-27', toca).hoy).toEqual({ cuadriceps: 2 })
  })
})
