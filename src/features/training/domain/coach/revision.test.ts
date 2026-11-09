import { describe, expect, it } from 'vitest'
import type { Entreno } from '../workoutHistory.ts'
import type { EjercicioPlan, SesionPlan } from '../workoutPlan.ts'
import {
  compararSerie,
  lecturaMejora,
  lunesDe,
  mejoraPorMusculo,
  propuestaDeQuitar,
  propuestaDeSerie,
  revisionEntrenador,
  type Mejora,
  type Semanas,
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
const m = (comparables: number, mejoran: number, peores = 0): Mejora => ({ comparables, mejoran, peores })
const semanas = (...x: (Mejora | undefined)[]): Semanas => [x[0], x[1], x[2]]

describe('compararSerie (doble progresión)', () => {
  it('mejora al llegar al máximo del rango o al subir el peso sin bajar del mínimo; peor si baja el 1RM', () => {
    expect(compararSerie({ kg: 100, reps: 12 }, { kg: 100, reps: 10 }, [8, 12])).toBe(1)
    expect(compararSerie({ kg: 105, reps: 8 }, { kg: 100, reps: 12 }, [8, 12])).toBe(1)
    // Una repetición más sin llegar al máximo: aún no cuenta como mejora
    expect(compararSerie({ kg: 100, reps: 11 }, { kg: 100, reps: 10 }, [8, 12])).toBe(0)
    expect(compararSerie({ kg: 100, reps: 8 }, { kg: 100, reps: 10 }, [8, 12])).toBe(-1)
    // Sin rango conocido, por el 1RM estimado
    expect(compararSerie({ kg: 100, reps: 11 }, { kg: 100, reps: 10 }, null)).toBe(1)
  })
})

describe('mejoraPorMusculo', () => {
  it('cada serie entre dos fechas frente a la misma serie de la vez anterior del ejercicio', () => {
    const antes = entreno('2026-11-01', 1, [
      [100, 10],
      [100, 9],
      [100, 8],
    ])
    const ahora = entreno('2026-11-05', 2, [
      [100, 12],
      [100, 9],
      [100, 7],
    ])
    expect(mejoraPorMusculo([ahora, antes], '2026-11-03', '2026-11-09', { Prensa: [8, 12] })).toEqual({
      cuadriceps: { comparables: 3, mejoran: 1, peores: 1 },
    })
    expect(mejoraPorMusculo([antes], '2026-10-01', '2026-11-09')).toEqual({})
  })
})

describe('lecturaMejora', () => {
  it('ir peor en el 10 % manda; casi todas → subir; algunas → dulce; ninguna → estancado; pocas → nada', () => {
    expect(lecturaMejora(m(10, 9, 1))).toBe('cae')
    expect(lecturaMejora(m(10, 8))).toBe('subir')
    expect(lecturaMejora(m(10, 3))).toBe('dulce')
    expect(lecturaMejora(m(10, 0))).toBe('estancado')
    expect(lecturaMejora(m(3, 3))).toBe('pocos')
  })
})

describe('propuestas', () => {
  it('+1 serie al de menos series (máx. 4 en compuestos y 11 en la sesión); −1 al de más (nunca por debajo de 2)', () => {
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
    expect(propuestaDeQuitar(semana, 'cuadriceps')).toMatchObject({ sigla: 'A1', de: 3, a: 2 })
    expect(propuestaDeQuitar([sesion('B1', [ej({ series: 2 })])], 'cuadriceps')).toBeNull()
  })
})

describe('revisionEntrenador', () => {
  const semana = [
    sesion('A1', [
      ej({ nombre: 'Prensa', musculo: 'cuadriceps', series: 3 }),
      ej({ nombre: 'Curl', musculo: 'biceps', series: 3, compuesto: false }),
      ej({ nombre: 'Press', musculo: 'pecho', series: 3 }),
      ej({ nombre: 'Remo', musculo: 'dorsal', series: 3 }),
    ]),
  ]
  const base = { semana, fase: 'volumen' as const, modos: {} }

  it('toca subir: como mucho 2 músculos, primero los de Prioridad; los de Mantener no suben', () => {
    const r = revisionEntrenador({
      ...base,
      semanas: {
        cuadriceps: semanas(m(6, 6)),
        biceps: semanas(m(6, 6)),
        pecho: semanas(m(6, 6)),
        dorsal: semanas(m(6, 6)),
      },
      modos: { pecho: 'priority', dorsal: 'maintain' },
    })
    const suben = r.filter((c) => c.lectura === 'subir').map((c) => c.musculo)
    expect(suben).toHaveLength(2)
    expect(suben[0]).toBe('pecho')
    expect(r.map((c) => c.musculo)).not.toContain('dorsal')
    expect(r.find((c) => c.lectura === 'subir')).toMatchObject({
      noMeInteresa: true,
      propuesta: { de: 3, a: 4 },
    })
    expect(r.find((c) => c.lectura === 'subir')?.detalle).toContain('toca subir volumen')
  })

  it('tras aplicar un cambio la semana pasada, espera a ver el efecto', () => {
    const r = revisionEntrenador({
      ...base,
      semanas: { cuadriceps: semanas(m(6, 6)) },
      aplicadoHace: new Set(['cuadriceps']),
    })
    expect(r[0]).toMatchObject({ lectura: 'dulce', propuesta: null })
  })

  it('vas peor: primero aviso; si se repite la semana siguiente, −1 serie', () => {
    const una = revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(m(6, 3, 1)) } })
    expect(una[0]).toMatchObject({ lectura: 'cae', propuesta: null })
    expect(una[0].detalle).toContain('sueño')
    const dos = revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(m(6, 3, 1), m(6, 2, 2)) } })
    expect(dos[0].propuesta).toMatchObject({ de: 3, a: 2 })
  })

  it('estancado: sueño y comida (y kcal en volumen), luego el RIR y luego +1 serie; nunca cambiar de ejercicio', () => {
    const igual = m(6, 0)
    const s1 = revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(igual) } })
    expect(s1[0].detalle).toContain('duerme bien')
    expect(s1[0].detalle).toContain('calorías')
    const s2 = revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(igual, igual) } })
    expect(s2[0].detalle).toContain('RIR')
    const s3 = revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(igual, igual, igual) } })
    expect(s3[0].propuesta).toMatchObject({ de: 3, a: 4 })
    expect([s1, s2, s3].flat().some((c) => /cambia de ejercicio/i.test(c.detalle))).toBe(false)
  })

  it('en definición, estancado es solo un aviso suave; en Mantener, estable está bien', () => {
    const igual = m(6, 0)
    const def = revisionEntrenador({
      ...base,
      fase: 'definicion',
      semanas: { cuadriceps: semanas(igual, igual, igual) },
    })
    expect(def[0]).toMatchObject({ propuesta: null })
    expect(def[0].detalle).toContain('mantener tus marcas ya está bien')
    const mant = revisionEntrenador({
      ...base,
      modos: { cuadriceps: 'maintain' },
      semanas: { cuadriceps: semanas(igual) },
    })
    expect(mant).toEqual([])
  })
})

describe('lunesDe', () => {
  it('el lunes de esa semana', () => {
    expect(lunesDe('2026-11-09')).toBe('2026-11-09')
    expect(lunesDe('2026-11-15')).toBe('2026-11-09')
  })
})
