import { describe, expect, it } from 'vitest'
import type { Entreno } from '../workoutHistory.ts'
import type { EjercicioPlan, SesionPlan } from '../workoutPlan.ts'
import {
  lecturaMejora,
  lunesDe,
  mejoraPorMusculo,
  propuestaDeSerie,
  revisionEntrenador,
  type Mejora,
} from './revision.ts'

const entreno = (fecha: string, inicio: number, series: [number, number][]): Entreno => ({
  id: fecha,
  fecha,
  inicio,
  segundos: 3600,
  sigla: 'A1',
  nombre: 'A1',
  programId: 'p',
  ejercicios: [
    {
      nombre: 'Prensa',
      musculo: 'cuadriceps',
      puesto: 1,
      series: series.map(([kg, reps]) => ({ kg, reps })),
    },
  ],
})

const ej = (over: Partial<EjercicioPlan>): EjercicioPlan => ({
  nombre: 'Prensa',
  series: 3,
  reps: '8–12',
  rir: 2,
  ultima: [],
  descanso: 120,
  musculo: 'cuadriceps',
  secundarios: [],
  compuesto: true,
  salto: 5,
  sustitutos: [],
  sugeridos: [],
  ...over,
})
const sesion = (sigla: string, ejercicios: EjercicioPlan[]): SesionPlan => ({
  sigla,
  nombre: sigla,
  minutos: 60,
  ejercicios,
})

describe('mejoraPorMusculo', () => {
  it('cada serie de la semana frente a la misma serie de la vez anterior del ejercicio', () => {
    const antes = entreno('2026-11-01', 1, [
      [100, 10],
      [100, 9],
      [100, 8],
    ])
    const ahora = entreno('2026-11-05', 2, [
      [100, 11],
      [100, 9],
      [100, 7],
    ])
    expect(mejoraPorMusculo([ahora, antes], '2026-11-03')).toEqual({
      cuadriceps: { comparables: 3, mejoran: 1, peores: 1 },
    })
    // La primera vez que lo haces no hay con qué comparar
    expect(mejoraPorMusculo([antes], '2026-10-01')).toEqual({})
  })
})

describe('lecturaMejora', () => {
  const m = (comparables: number, mejoran: number, peores = 0): Mejora => ({ comparables, mejoran, peores })
  it('casi todas → subir; algunas → punto dulce; ninguna → estancado; peor → cae; pocas → nada', () => {
    expect(lecturaMejora(m(10, 8))).toBe('subir')
    expect(lecturaMejora(m(10, 3))).toBe('dulce')
    expect(lecturaMejora(m(10, 0))).toBe('estancado')
    expect(lecturaMejora(m(10, 1, 6))).toBe('cae')
    expect(lecturaMejora(m(3, 3))).toBe('pocos')
  })
})

describe('propuestaDeSerie', () => {
  it('+1 serie al ejercicio del músculo con menos series, sin pasar de 4 en compuestos ni de 11 en la sesión', () => {
    const semana = [
      sesion('A1', [ej({ nombre: 'Prensa', series: 3 })]),
      sesion('B1', [ej({ nombre: 'Hack', series: 2 })]),
    ]
    expect(propuestaDeSerie(semana, 'cuadriceps')).toEqual({
      sigla: 'B1',
      clave: 'Hack',
      nombre: 'Hack',
      de: 2,
      a: 3,
    })
    expect(propuestaDeSerie([sesion('A1', [ej({ series: 4 })])], 'cuadriceps')).toBeNull()
    const llena = sesion('A1', [
      ej({ nombre: 'Prensa', series: 4 }),
      ej({ nombre: 'Hack', series: 4 }),
      ej({ nombre: 'Extensión', series: 3, compuesto: false }),
    ])
    expect(propuestaDeSerie([llena], 'cuadriceps')).toBeNull()
  })
})

describe('revisionEntrenador', () => {
  it('primero lo que pide algo; en definición, el tono cambia', () => {
    const r = revisionEntrenador({
      mejora: {
        biceps: { comparables: 6, mejoran: 2, peores: 0 },
        cuadriceps: { comparables: 6, mejoran: 5, peores: 0 },
      },
      semana: [sesion('A1', [ej({ series: 3 })])],
      definicion: true,
    })
    expect(r.map((c) => c.lectura)).toEqual(['subir', 'dulce'])
    expect(r[0].propuesta).toMatchObject({ sigla: 'A1', de: 3, a: 4 })
    expect(r[0].detalle).toContain('puedes subir volumen')
    expect(r[0].detalle).toContain('En definición')
  })
  it('estancado: nunca propone cambiar de ejercicio', () => {
    const r = revisionEntrenador({
      mejora: { pecho: { comparables: 6, mejoran: 0, peores: 0 } },
      semana: [],
      definicion: false,
    })
    expect(r[0]).toMatchObject({ lectura: 'estancado', propuesta: null })
    expect(r[0].detalle).toContain('No cambies de ejercicio')
  })
})

describe('lunesDe', () => {
  it('el lunes de esa semana', () => {
    expect(lunesDe('2026-11-09')).toBe('2026-11-09')
    expect(lunesDe('2026-11-15')).toBe('2026-11-09')
  })
})
