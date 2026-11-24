import { describe, expect, it } from 'vitest'
import type { Mesociclo, Objetivo } from './mesocycles.ts'
import { comparables, compararVueltas, nombreDeVuelta, parejaDe } from './vueltas.ts'
import type { Entreno } from './workoutHistory.ts'

const etapa = (
  id: string,
  inicio: string,
  fin: string | null,
  objetivo: Objetivo | null = 'cut',
  programId = 'x',
): Mesociclo => ({
  id,
  nombre: id,
  inicio,
  fin,
  objetivo,
  rutina: 'Rutina X',
  programId,
  plan: null,
  sesiones: [
    { sigla: 'A1', nombre: 'Pierna', ejercicios: [{ nombre: 'Sentadilla', series: 3, reps: '6–8', rir: 2 }] },
    { sigla: 'B1', nombre: 'Torso', ejercicios: [{ nombre: 'Press banca', series: 3, reps: '6–8', rir: 2 }] },
  ],
  sesionesPorSemana: 2,
})

/** Un entreno con un ejercicio y una serie (kg × reps). */
const entreno = (fecha: string, sigla: string, nombre: string, kg: number, reps: number): Entreno => ({
  id: `${fecha}-${sigla}`,
  fecha,
  inicio: Date.parse(`${fecha}T10:00:00Z`),
  segundos: 3600,
  sigla,
  nombre: sigla,
  programId: 'x',
  ejercicios: [{ nombre, musculo: null, series: [{ kg, reps }], puesto: 1 }],
})

describe('con qué etapa se compara', () => {
  const todas = [
    etapa('defi-1', '2024-01-01', '2024-03-01', 'cut'),
    etapa('volumen', '2024-03-02', '2024-09-01', 'bulk'),
    etapa('otra-rutina', '2024-09-02', '2025-01-01', 'cut', 'cf'),
    etapa('defi-2', '2026-01-05', null, 'cut'),
  ]

  it('solo con la misma rutina: otra rutina no se compara nunca', () => {
    expect(comparables(todas[3], todas).map((x) => x.id)).toEqual(['volumen', 'defi-1'])
    expect(comparables(todas[2], todas)).toEqual([])
    expect(parejaDe(todas[2], todas)).toBeNull()
  })

  it('primero, la anterior con el mismo objetivo (definición con definición), aunque haya otra más reciente', () => {
    expect(parejaDe(todas[3], todas)?.id).toBe('defi-1')
  })

  it('sin el mismo objetivo, la anterior con la misma rutina; la primera de todas, con la siguiente', () => {
    const sinDefi = [todas[1], { ...todas[3], objetivo: 'maintenance' as const }]
    expect(parejaDe(sinDefi[1], sinDefi)?.id).toBe('volumen')
    expect(parejaDe(todas[0], todas)?.id).toBe('defi-2')
  })

  it('una sola etapa: nada con qué comparar', () => {
    expect(parejaDe(todas[3], [todas[3]])).toBeNull()
  })
})

describe('el nombre de la vuelta siguiente', () => {
  it('«Definición» → «· vuelta 2», y cuenta las siguientes', () => {
    expect(nombreDeVuelta('Definición')).toBe('Definición · vuelta 2')
    expect(nombreDeVuelta('Definición · vuelta 2')).toBe('Definición · vuelta 3')
    expect(nombreDeVuelta('Definición · vuelta 9')).toBe('Definición · vuelta 10')
  })
})

describe('dos vueltas a la misma semana', () => {
  // La vuelta 1: lunes 1 ene 2024, 3 semanas. La 2: lunes 5 ene 2026, va por la semana 2 (hoy, miércoles)
  const antes = etapa('v1', '2024-01-01', '2024-01-21')
  const ahora = etapa('v2', '2026-01-05', null)
  const hoy = '2026-01-14'
  const entrenos = [
    // Vuelta 1
    entreno('2024-01-01', 'A1', 'Sentadilla', 100, 8),
    entreno('2024-01-03', 'B1', 'Press banca', 80, 8),
    entreno('2024-01-08', 'A1', 'Sentadilla', 102.5, 8),
    entreno('2024-01-10', 'B1', 'Press banca', 80, 9),
    entreno('2024-01-15', 'A1', 'Sentadilla', 105, 8),
    // Vuelta 2
    entreno('2026-01-05', 'A1', 'Sentadilla', 105, 8),
    entreno('2026-01-07', 'B1', 'Press banca', 82.5, 8),
    entreno('2026-01-12', 'A1', 'Sentadilla', 110, 8),
  ]

  it('compara la semana en la que vas (la 2) y las medias solo con semanas enteras (la 1)', () => {
    const v = compararVueltas(antes, ahora, entrenos, hoy, ['Sentadilla'])
    expect(v?.semana).toBe(2)
    expect(v?.cerradas).toBe(1)
  })

  it('ejercicio a ejercicio: tu mejor serie de esa semana en cada vuelta', () => {
    const v = compararVueltas(antes, ahora, entrenos, hoy, ['Sentadilla'])
    const sentadilla = v?.ejercicios.find((e) => e.nombre === 'Sentadilla')
    expect(sentadilla).toMatchObject({ a: { kg: 102.5, reps: 8 }, b: { kg: 110, reps: 8 }, cambio: 1 })
    // El press banca de la semana 2 aún no lo has hecho: no se compara (no cuenta en contra)
    expect(v?.ejercicios.find((e) => e.nombre === 'Press banca')).toMatchObject({ b: null, cambio: null })
    expect(v).toMatchObject({ delante: 1, comparados: 1 })
  })

  it('sesión a sesión: lo que moviste en esa semana; la que falta, null', () => {
    const v = compararVueltas(antes, ahora, entrenos, hoy, ['Sentadilla'])
    expect(v?.sesiones).toEqual([
      { sigla: 'A1', nombre: 'Pierna', a: 0.82, b: 0.88 },
      { sigla: 'B1', nombre: 'Torso', a: 0.72, b: null },
    ])
  })

  it('la carrera: tu fuerza semana a semana de cada una, desde su semana 1', () => {
    const v = compararVueltas(antes, ahora, entrenos, hoy, ['Sentadilla'])
    expect(v?.carrera.a).toHaveLength(3)
    expect(v?.carrera.b).toHaveLength(2)
    expect(v?.carrera.a[0]).toBe(0)
    expect(v?.fuerza.b ?? 0).toBeGreaterThan(v?.fuerza.a ?? 0)
  })

  it('constancia y toneladas, con las semanas enteras de las dos', () => {
    const v = compararVueltas(antes, ahora, entrenos, hoy, ['Sentadilla'])
    expect(v?.constancia).toEqual({ a: 100, b: 100 })
    expect(v?.toneladas?.a).toBeCloseTo(0.8 + 0.64, 5)
  })

  it('si la de ahora ya pasó de lo que duró la anterior, se compara su última semana', () => {
    const larga = etapa('v2', '2026-01-05', '2026-02-15')
    expect(compararVueltas(antes, larga, entrenos, '2026-03-01', [])?.semana).toBe(3)
  })

  it('en la primera semana de la de ahora: sin medias todavía', () => {
    const v = compararVueltas(antes, ahora, entrenos, '2026-01-06', [])
    expect(v).toMatchObject({ semana: 1, cerradas: 0, toneladas: null, constancia: null })
  })

  it('un ejercicio igual (±0,5 %) cuenta como igual, y peor como peor', () => {
    const lista = [
      entreno('2024-01-01', 'A1', 'Sentadilla', 100, 8),
      entreno('2026-01-05', 'A1', 'Sentadilla', 100, 8),
      entreno('2024-01-03', 'B1', 'Press banca', 80, 8),
      entreno('2026-01-07', 'B1', 'Press banca', 75, 8),
    ]
    const v = compararVueltas(antes, ahora, lista, '2026-01-11', [])
    expect(v?.ejercicios.map((e) => e.cambio)).toEqual([0, -1])
    expect(v).toMatchObject({ delante: 0, comparados: 2 })
  })

  it('sin entrenos todavía: sin ejercicios que comparar, pero no falla', () => {
    const v = compararVueltas(antes, ahora, [], hoy, ['Sentadilla'])
    expect(v).toMatchObject({ comparados: 0, ejercicios: [] })
  })
})
