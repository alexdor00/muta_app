import { describe, expect, it } from 'vitest'
import { basicosDe, ejerciciosEnElTiempo, fuerzaEnTramo, fuerzaPorSemana } from './strengthHistory.ts'
import type { Entreno } from './workoutHistory.ts'

function entreno(fecha: string, ejercicios: [string, number][]): Entreno {
  return {
    id: fecha,
    fecha,
    inicio: Date.parse(`${fecha}T10:00:00Z`),
    segundos: 3600,
    sigla: 'A1',
    nombre: 'Sesión',
    programId: 'p',
    ejercicios: ejercicios.map(([nombre, kg], i) => ({
      nombre,
      musculo: null,
      series: [{ kg, reps: 5 }],
      puesto: i + 1,
    })),
  }
}

// Lunes 2, 9 y 16 de noviembre de 2026
const lista = [
  entreno('2026-11-02', [
    ['Sentadilla', 100],
    ['Press banca', 80],
    ['Curl', 15],
  ]),
  entreno('2026-11-04', [['Sentadilla', 100]]),
  entreno('2026-11-10', [['Sentadilla', 105]]),
  entreno('2026-11-17', [
    ['Sentadilla', 110],
    ['Press banca', 84],
  ]),
]
const compuesto = (n: string) => n !== 'Curl'

describe('tu fuerza con el tiempo', () => {
  it('tus básicos: los compuestos que más repites', () => {
    expect(basicosDe(lista, compuesto)).toEqual(['Sentadilla', 'Press banca'])
    expect(basicosDe(lista, compuesto, 1)).toEqual(['Sentadilla'])
  })

  it('en un tramo: de la primera semana a la última de cada básico y el cambio medio', () => {
    const t = fuerzaEnTramo(lista, ['Sentadilla', 'Press banca'], null, null)
    expect(t?.basicos.map((b) => [b.nombre, b.cambio])).toEqual([
      ['Sentadilla', 0.1],
      ['Press banca', 0.05],
    ])
    expect(t?.cambio).toBe(0.075)
    // Un básico hecho en una sola semana del tramo no cuenta
    expect(fuerzaEnTramo(lista, ['Press banca'], '2026-11-09', null)).toBeNull()
    expect(fuerzaEnTramo(lista, ['Sentadilla'], '2026-11-09', null)?.cambio).toBeCloseTo(0.048, 3)
  })

  it('semana a semana: frente a la primera, con la última si una semana no se hizo', () => {
    expect(fuerzaPorSemana(lista, ['Sentadilla', 'Press banca'])).toEqual([
      { lunes: '2026-11-02', cambio: 0 },
      { lunes: '2026-11-09', cambio: 0.025 },
      { lunes: '2026-11-16', cambio: 0.075 },
    ])
  })

  it('cada ejercicio con su músculo y su mejor 1RM de cada día', () => {
    const ej = ejerciciosEnElTiempo(lista, (n) =>
      n === 'Curl' ? 'biceps' : n === 'Sentadilla' ? 'cuadriceps' : 'pecho',
    )
    const sentadilla = ej.find((e) => e.nombre === 'Sentadilla')
    expect(sentadilla?.musculo).toBe('cuadriceps')
    expect(sentadilla?.puntos.map((p) => p.fecha)).toEqual([
      '2026-11-02',
      '2026-11-04',
      '2026-11-10',
      '2026-11-17',
    ])
    expect(sentadilla?.puntos[0].e1rm).toBeCloseTo(116.7, 1)
    expect(sentadilla?.puntos[0].serie).toEqual({ kg: 100, reps: 5 })
    expect(ej.map((e) => e.nombre).sort()).toEqual(['Curl', 'Press banca', 'Sentadilla'])
  })
})
