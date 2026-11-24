import { describe, expect, it } from 'vitest'
import type { Entreno } from '../workoutHistory.ts'
import {
  cercaDelFallo,
  diasDeParon,
  estadoDeLaSemana,
  lejosDelFallo,
  seriesConRir,
  tocaCalibrar,
  type DeNutricion,
} from './semana.ts'

const HOY = '2026-11-23'
const entreno = (fecha: string, rirs: (number | undefined)[] = [2, 2, 2], nombre = 'Prensa'): Entreno => ({
  id: fecha,
  fecha,
  inicio: 0,
  segundos: 3600,
  sigla: 'A1',
  nombre: 'A1',
  programId: 'p',
  ejercicios: [
    {
      nombre,
      musculo: 'cuadriceps',
      puesto: 1,
      series: rirs.map((rir) => ({ kg: 100, reps: 10, ...(rir === undefined ? {} : { rir }) })),
    },
  ],
})

const nutri = (over: Partial<DeNutricion> = {}): DeNutricion => ({
  fase: 'volumen',
  finDefinicion: false,
  pausaHasta: null,
  recargaPropuesta: false,
  cambioKcal: null,
  comida: null,
  fuerzaBaja: false,
  recuperacion: [],
  ...over,
})

const base = {
  hoy: HOY,
  sesiones: 4,
  objetivo: 4,
  rir: { total: 20, con: 20 },
  lejos: [],
  paron: null,
  nutricion: nutri(),
}

describe('diasDeParon', () => {
  it('un hueco de 14 días o más que acabó en las dos últimas semanas', () => {
    expect(diasDeParon([entreno('2026-10-20'), entreno('2026-11-18')], HOY)).toEqual({
      dias: 29,
      vuelta: '2026-11-18',
    })
    // Acabó hace más de dos semanas: ya no vuelves de él
    expect(
      diasDeParon(
        [
          entreno('2026-09-01'),
          entreno('2026-10-01'),
          entreno('2026-11-02'),
          entreno('2026-11-09'),
          entreno('2026-11-16'),
          entreno('2026-11-20'),
        ],
        HOY,
      ),
    ).toBeNull()
    // 13 días no es parón; sin entrenos o con uno solo, tampoco
    expect(diasDeParon([entreno('2026-11-05'), entreno('2026-11-18')], HOY)).toBeNull()
    expect(diasDeParon([], HOY)).toBeNull()
    expect(diasDeParon([entreno('2026-11-20')], HOY)).toBeNull()
    // Lo de después de hoy no cuenta
    expect(diasDeParon([entreno('2026-11-20'), entreno('2026-12-20')], HOY)).toBeNull()
  })
})

describe('lejosDelFallo y seriesConRir', () => {
  it('lejos: todas las series con RIR y la mejor a 2 o más de la pauta', () => {
    const lista = [entreno('2026-11-20', [4, 4, 5]), entreno('2026-11-21', [3, 2, 2], 'Curl')]
    const pauta = (n: string) => (n === 'Prensa' ? 1 : 2)
    expect(lejosDelFallo(lista, '2026-11-17', HOY, pauta)).toEqual([{ nombre: 'Prensa', rir: 4, pauta: 1 }])
    // Una serie sin RIR: no se puede saber
    expect(lejosDelFallo([entreno('2026-11-20', [4, undefined])], '2026-11-17', HOY, pauta)).toEqual([])
    // Sin pauta, tampoco
    expect(lejosDelFallo(lista, '2026-11-17', HOY, () => undefined)).toEqual([])
  })

  it('series con RIR, solo en la semana', () => {
    const lista = [entreno('2026-11-20', [2, undefined, 1]), entreno('2026-11-01', [2, 2])]
    expect(seriesConRir(lista, '2026-11-17', HOY)).toEqual({ total: 3, con: 2 })
    expect(seriesConRir([], '2026-11-17', HOY)).toEqual({ total: 0, con: 0 })
  })
})

describe('tocaCalibrar', () => {
  it('en la vuelta que sigue a cada cuarta', () => {
    expect(tocaCalibrar(15, 4)).toBe(false)
    expect(tocaCalibrar(16, 4)).toBe(true)
    expect(tocaCalibrar(19, 4)).toBe(true)
    expect(tocaCalibrar(20, 4)).toBe(false)
    expect(tocaCalibrar(32, 4)).toBe(true)
    expect(tocaCalibrar(0, 4)).toBe(false)
    expect(tocaCalibrar(10, 0)).toBe(false)
  })
})

describe('estadoDeLaSemana: una cosa cada vez, en su orden', () => {
  it('sin nada raro: normal, se puede subir y quitar', () => {
    const e = estadoDeLaSemana(base)
    expect(e).toMatchObject({ foco: 'normal', sinSubir: false, sinQuitar: false })
  })

  it('el parón manda sobre todo lo demás', () => {
    const e = estadoDeLaSemana({
      ...base,
      paron: { dias: 20, vuelta: '2026-11-20' },
      rir: { total: 10, con: 0 },
      nutricion: nutri({ recuperacion: ['duermes poco'] }),
    })
    expect(e).toMatchObject({ foco: 'paron', titulo: 'Vuelve con menos volumen', sinSubir: true })
    expect(e.filas[0]).toEqual({ etiqueta: 'Días sin entrenar', valor: '20' })
  })

  it('sin RIR apuntado no se lee la semana; las sesiones que faltan no la paran', () => {
    const sinRir = estadoDeLaSemana({ ...base, rir: { total: 20, con: 9 } })
    expect(sinRir).toMatchObject({ foco: 'datos', sinSubir: true, sinQuitar: true })
    expect(estadoDeLaSemana({ ...base, rir: { total: 0, con: 0 } }).foco).toBe('datos')
    expect(estadoDeLaSemana({ ...base, sesiones: 1 }).foco).toBe('normal')
  })

  it('lejos del fallo, antes que la recarga o cómo estás', () => {
    const e = estadoDeLaSemana({
      ...base,
      lejos: [{ nombre: 'Prensa', rir: 4, pauta: 1 }],
      nutricion: nutri({ recuperacion: ['duermes poco'], pausaHasta: '2026-11-30' }),
    })
    expect(e).toMatchObject({ foco: 'fallo', titulo: 'Acércate a tu RIR' })
    expect(e.filas[0]).toEqual({ etiqueta: 'Prensa', valor: 'RIR 4 · pauta 1' })
  })

  it('la recarga de Nutrición pausa la lectura hasta su fin; después, normal', () => {
    const en = estadoDeLaSemana({ ...base, nutricion: nutri({ pausaHasta: '2026-11-30' }) })
    expect(en).toMatchObject({ foco: 'recarga', sinSubir: true, sinQuitar: true })
    const pasada = estadoDeLaSemana({ ...base, nutricion: nutri({ pausaHasta: '2026-11-22' }) })
    expect(pasada.foco).toBe('normal')
  })

  it('fin de la definición con la fuerza bajando: la recarga, no quitar series', () => {
    const e = estadoDeLaSemana({
      ...base,
      nutricion: nutri({ fase: 'definicion', finDefinicion: true, fuerzaBaja: true }),
    })
    expect(e).toMatchObject({ foco: 'finDefi', sinQuitar: true })
    // Sin la fuerza bajando, o sin ser el final, no
    expect(estadoDeLaSemana({ ...base, nutricion: nutri({ finDefinicion: true }) }).foco).toBe('normal')
    expect(estadoDeLaSemana({ ...base, nutricion: nutri({ fuerzaBaja: true }) }).foco).toBe('normal')
  })

  it('cómo estás (las señales del nutricionista): esa semana no se sube', () => {
    const e = estadoDeLaSemana({
      ...base,
      nutricion: nutri({ recuperacion: ['duermes poco', 'tienes mucho estrés'] }),
    })
    expect(e).toMatchObject({ foco: 'recuperacion', sinSubir: true, sinQuitar: false })
    expect(e.filas[0]).toEqual({ etiqueta: 'Recuperación', valor: 'Duermes poco, tienes mucho estrés' })
  })

  it('tus kcal acaban de cambiar: una semana sin quitar series', () => {
    expect(estadoDeLaSemana({ ...base, nutricion: nutri({ cambioKcal: '2026-11-20' }) })).toMatchObject({
      foco: 'normal',
      sinQuitar: true,
    })
    expect(estadoDeLaSemana({ ...base, nutricion: nutri({ cambioKcal: '2026-11-10' }) }).sinQuitar).toBe(
      false,
    )
  })

  it('sin objetivo de comida, funciona igual con lo suyo', () => {
    expect(estadoDeLaSemana({ ...base, nutricion: null }).foco).toBe('normal')
  })
})

describe('cercaDelFallo (guía § 3; 02-reglas § 5)', () => {
  it('RIR de media 1,5 o más por debajo de la pauta', () => {
    const pauta = () => 2
    expect(cercaDelFallo([entreno('2026-11-20', [0, 0, 1])], '2026-11-17', HOY, pauta)).toEqual(['Prensa'])
    // A 1 por debajo, aún vale; sin RIR o sin pauta, no se sabe
    expect(cercaDelFallo([entreno('2026-11-20', [1, 1, 1])], '2026-11-17', HOY, pauta)).toEqual([])
    expect(cercaDelFallo([entreno('2026-11-20', [undefined])], '2026-11-17', HOY, pauta)).toEqual([])
    expect(cercaDelFallo([entreno('2026-11-20', [0, 0])], '2026-11-17', HOY, () => undefined)).toEqual([])
    // Fuera de la semana, no cuenta
    expect(cercaDelFallo([entreno('2026-11-01', [0, 0])], '2026-11-17', HOY, pauta)).toEqual([])
  })
})
