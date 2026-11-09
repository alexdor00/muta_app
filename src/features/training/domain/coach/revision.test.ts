import { describe, expect, it } from 'vitest'
import type { Entreno } from '../workoutHistory.ts'
import type { EjercicioPlan, SesionPlan } from '../workoutPlan.ts'
import {
  compararSerie,
  esfuerzoEstandar,
  lecturaMejora,
  lunesDe,
  mejoraPorMusculo,
  propuestaDeIntensidad,
  propuestaDeQuitar,
  propuestaDeSerie,
  revisionEntrenador,
  type Mejora,
  type Semanas,
} from './revision.ts'

const entreno = (fecha: string, inicio: number, series: [number, number][], rir?: number): Entreno => ({
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
      series: series.map(([kg, reps]) => ({ kg, reps, ...(rir === undefined ? {} : { rir }) })),
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
const m = (comparables: number, mejoran: number, peores = 0): Mejora => ({
  comparables,
  mejoran,
  peores,
  sinRir: 0,
})
const semanas = (...x: (Mejora | undefined)[]): Semanas => [x[0], x[1], x[2], x[3]]

describe('compararSerie', () => {
  it('mejora con más kilos (sin bajar del mínimo) o más repeticiones; peor si baja sin haber subido el peso', () => {
    expect(compararSerie({ kg: 100, reps: 11 }, { kg: 100, reps: 10 }, [8, 12])).toBe(1)
    expect(compararSerie({ kg: 105, reps: 8 }, { kg: 100, reps: 12 }, [8, 12])).toBe(1)
    expect(compararSerie({ kg: 105, reps: 7 }, { kg: 100, reps: 12 }, [8, 12])).toBe(0)
    expect(compararSerie({ kg: 100, reps: 10 }, { kg: 100, reps: 10 }, [8, 12])).toBe(0)
    expect(compararSerie({ kg: 100, reps: 8 }, { kg: 100, reps: 10 }, [8, 12])).toBe(-1)
  })
})

describe('esfuerzoEstandar', () => {
  it('todas las series con su RIR a ±1 del de la rutina', () => {
    expect(
      esfuerzoEstandar(
        [
          { kg: 1, reps: 1, rir: 2 },
          { kg: 1, reps: 1, rir: 1 },
        ],
        2,
      ),
    ).toBe(true)
    expect(esfuerzoEstandar([{ kg: 1, reps: 1, rir: 4 }], 2)).toBe(false)
    expect(esfuerzoEstandar([{ kg: 1, reps: 1 }], 2)).toBe(false)
  })
})

describe('mejoraPorMusculo', () => {
  const antes = entreno('2026-11-01', 1, [
    [100, 10],
    [100, 9],
    [100, 8],
  ])
  it('cada serie entre dos fechas frente a la misma de la vez anterior; sin RIR apuntado, no cuenta', () => {
    const ahora = (rir?: number) =>
      entreno(
        '2026-11-05',
        2,
        [
          [100, 11],
          [100, 9],
          [100, 7],
        ],
        rir,
      )
    const pautas = { Prensa: { rango: [8, 12] as [number, number], rir: 2 } }
    expect(mejoraPorMusculo([ahora(2), antes], '2026-11-03', '2026-11-09', pautas)).toEqual({
      cuadriceps: { comparables: 3, mejoran: 1, peores: 1, sinRir: 0 },
    })
    expect(mejoraPorMusculo([ahora(), antes], '2026-11-03', '2026-11-09', pautas)).toEqual({
      cuadriceps: { comparables: 0, mejoran: 0, peores: 0, sinRir: 1 },
    })
  })
})

describe('lecturaMejora', () => {
  it('ir peor en el 10 % manda; casi todas → subir; algunas → dulce; ninguna → estancado; pocas → nada', () => {
    expect(lecturaMejora(m(10, 9, 1))).toBe('cae')
    expect(lecturaMejora(m(10, 8))).toBe('subir')
    expect(lecturaMejora(m(10, 2))).toBe('dulce')
    expect(lecturaMejora(m(10, 0))).toBe('estancado')
    expect(lecturaMejora(m(3, 3))).toBe('pocos')
  })
})

describe('propuestas', () => {
  const semana = [
    sesion('A1', [ej({ nombre: 'Prensa', series: 3, rir: 1 })]),
    sesion('B1', [ej({ nombre: 'Hack', series: 2, rir: 2 })]),
  ]
  it('+1 serie al de menos series; −1 al de más (nunca por debajo de 2); RIR +1 al que va más cerca del fallo', () => {
    expect(propuestaDeSerie(semana, 'cuadriceps')).toMatchObject({
      sigla: 'B1',
      campo: 'series',
      de: 2,
      a: 3,
    })
    expect(propuestaDeSerie([sesion('A1', [ej({ series: 4 })])], 'cuadriceps')).toBeNull()
    expect(propuestaDeQuitar(semana, 'cuadriceps')).toMatchObject({ sigla: 'A1', de: 3, a: 2 })
    expect(propuestaDeIntensidad(semana, 'cuadriceps')).toMatchObject({
      sigla: 'A1',
      campo: 'rir',
      de: 1,
      a: 2,
    })
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
  const base = { semana, definicion: false, modos: {} }
  const tres = semanas(m(6, 6), m(6, 5), m(6, 6))

  it('toca subir tras 3 semanas mejorando: un solo músculo, primero los de Prioridad; Mantener no sube', () => {
    const r = revisionEntrenador({
      ...base,
      semanas: { cuadriceps: tres, biceps: tres, pecho: tres, dorsal: tres },
      modos: { pecho: 'priority', dorsal: 'maintain' },
    })
    const suben = r.filter((c) => c.lectura === 'subir')
    expect(suben.map((c) => c.musculo)).toEqual(['pecho'])
    expect(suben[0]).toMatchObject({ noMeInteresa: true, propuesta: { campo: 'series', de: 3, a: 4 } })
    expect(r.map((c) => c.musculo)).not.toContain('dorsal')
  })

  it('con menos de 3 semanas mejorando, o con 2 series ya subidas, no propone subir', () => {
    const dos = revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(m(6, 6), m(6, 6)) } })
    expect(dos[0]).toMatchObject({ lectura: 'dulce', propuesta: null })
    expect(dos[0].detalle).toContain('2 de 3 semanas')
    const tope = revisionEntrenador({ ...base, semanas: { cuadriceps: tres }, subidas: { cuadriceps: 2 } })
    expect(tope[0].detalle).toContain('Editar rutina')
  })

  it('vas peor: primero aviso; si se repite la semana siguiente, −1 serie', () => {
    const una = revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(m(6, 3, 1)) } })
    expect(una[0]).toMatchObject({ lectura: 'cae', propuesta: null })
    const dos = revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(m(6, 3, 1), m(6, 2, 2)) } })
    expect(dos[0].propuesta).toMatchObject({ campo: 'series', de: 3, a: 2 })
  })

  it('estancado: sueño y comida → RIR → menos intensidad → −1 serie; nunca kcal ni cambiar de ejercicio', () => {
    const igual = m(6, 0)
    const paso = (n: number) =>
      revisionEntrenador({ ...base, semanas: { cuadriceps: semanas(...Array(n).fill(igual)) } })[0]
    expect(paso(1).detalle).toContain('duerme bien')
    expect(paso(1).detalle).not.toContain('calorías')
    expect(paso(2).detalle).toContain('RIR')
    expect(paso(3).propuesta).toMatchObject({ campo: 'rir', de: 2, a: 3 })
    expect(paso(4).propuesta).toMatchObject({ campo: 'series', de: 3, a: 2 })
  })

  it('en definición, estancado es solo un aviso suave; en Mantener, estable está bien', () => {
    const igual = m(6, 0)
    const def = revisionEntrenador({
      ...base,
      definicion: true,
      semanas: { cuadriceps: semanas(igual, igual, igual) },
    })
    expect(def[0]).toMatchObject({ propuesta: null })
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
