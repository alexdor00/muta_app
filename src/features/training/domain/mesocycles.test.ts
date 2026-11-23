import { describe, expect, it } from 'vitest'
import {
  constanciaDe,
  constanciaPorMes,
  musculosDe,
  rachaDeSemanas,
  resumenDe,
  semanaActual,
  semanasDe,
  semanasQueDura,
  type Mesociclo,
} from './mesocycles.ts'
import type { MuscleId } from './muscles.ts'
import type { Entreno } from './workoutHistory.ts'
import type { SerieHecha } from './workoutSet.ts'

function entreno(fecha: string, ejercicios: [string, SerieHecha[], MuscleId?][]): Entreno {
  return {
    id: fecha,
    fecha,
    inicio: Date.parse(`${fecha}T10:00:00Z`),
    segundos: 3600,
    sigla: 'A1',
    nombre: 'Sesión',
    programId: 'p',
    ejercicios: ejercicios.map(([nombre, series, musculo], i) => ({
      nombre,
      musculo: musculo ?? null,
      series,
      puesto: i + 1,
    })),
  }
}

const meso = (inicio: string, fin: string | null, porSemana = 2): Mesociclo => ({
  id: 'm',
  nombre: 'Bloque',
  inicio,
  fin,
  objetivo: 'bulk',
  rutina: 'Rutina',
  programId: 'p',
  plan: null,
  sesiones: [
    { sigla: 'A1', nombre: 'Torso', ejercicios: [{ nombre: 'Press', series: 3, reps: '6–8', rir: 2 }] },
  ],
  sesionesPorSemana: porSemana,
})

const serie = (kg: number, reps: number, rir?: number): SerieHecha => ({
  kg,
  reps,
  ...(rir === undefined ? {} : { rir }),
})

// Lunes 2 de noviembre de 2026 a hoy, martes 17
const lista = [
  entreno('2026-10-28', [['Press', [serie(60, 8)], 'pecho']]),
  entreno('2026-11-02', [['Press', [serie(62.5, 8, 2), serie(62.5, 7, 1)], 'pecho']]),
  entreno('2026-11-04', [['Sentadilla', [serie(100, 5, 2)], 'cuadriceps']]),
  entreno('2026-11-09', [['Press', [serie(65, 8, 3)], 'pecho']]),
  entreno('2026-11-16', [['Press', [serie(65, 6, 4)], 'pecho']]),
]
const HOY = '2026-11-17'

describe('semanas y resumen', () => {
  it('las semanas de lunes a domingo desde la de su inicio, con sus entrenos', () => {
    const s = semanasDe(meso('2026-11-02', null), lista, HOY)
    expect(s.map((w) => [w.lunes, w.entrenos.length, w.enCurso])).toEqual([
      ['2026-11-02', 2, false],
      ['2026-11-09', 1, false],
      ['2026-11-16', 1, true],
    ])
    expect(semanasQueDura(meso('2026-11-02', null), HOY)).toBe(3)
    expect(semanaActual(meso('2026-11-02', null), HOY)).toBe(3)
    expect(semanaActual(meso('2026-10-01', '2026-10-31'), HOY)).toBe(5)
  })

  it('sesiones, series, toneladas y récords (frente a lo de antes, también de otros mesociclos)', () => {
    const r = resumenDe(meso('2026-11-02', null), lista, HOY)
    expect(r.sesiones).toBe(4)
    expect(r.series).toBe(5)
    expect(r.toneladas).toBeCloseTo((62.5 * 15 + 500 + 65 * 14) / 1000)
    expect(r.records).toBe(2)
    expect(r.ejercicios[0]).toMatchObject({ nombre: 'Press', veces: 3 })
    expect(r.suben).toBe(0)
  })
})

describe('constancia y racha', () => {
  it('la semana en curso no cuenta; no se pasa de las planificadas', () => {
    const s = semanasDe(meso('2026-11-02', null), lista, HOY)
    expect(constanciaDe(s, 2)).toEqual({ hechas: 3, planificadas: 4, pct: 75, veredicto: 'Constante' })
  })

  it('la constancia de cada mes: cada semana, en el mes de su jueves', () => {
    const s = semanasDe(meso('2026-11-02', null), lista, HOY)
    expect(constanciaPorMes(s, 2)).toEqual({ '2026-11': constanciaDe(s, 2) })
    // La semana del 26 de octubre al 1 de noviembre tiene su jueves en octubre
    const desdeOctubre = semanasDe(meso('2026-10-26', null), lista, HOY)
    expect(Object.keys(constanciaPorMes(desdeOctubre, 2))).toEqual(['2026-10', '2026-11'])
  })

  it('semanas seguidas con las sesiones planificadas; la actual sin cumplir no la rompe', () => {
    expect(rachaDeSemanas(lista, 1, HOY, '2026-10-01')).toBe(4)
    expect(rachaDeSemanas(lista, 2, HOY, '2026-10-01')).toBe(0)
    expect(rachaDeSemanas(lista, 1, HOY, '2026-11-02')).toBe(3)
  })
})

describe('musculosDe', () => {
  it('series directas por semana frente al rango (sin la semana en curso); las indirectas aparte', () => {
    const s = semanasDe(meso('2026-11-02', null), lista, HOY)
    const m = musculosDe(
      s,
      (n) => (n === 'Press' ? { pecho: 1, triceps: 0.5 } : null),
      () => [2, 4],
    )
    expect(m?.find((x) => x.musculo === 'pecho')).toMatchObject({ series: 1.5, estado: 'bajo', veces: 1 })
    expect(m?.find((x) => x.musculo === 'triceps')).toMatchObject({ series: 0, indirectas: 1.5 })
    expect(m?.find((x) => x.musculo === 'cuadriceps')).toMatchObject({ series: 0.5 })
    expect(
      musculosDe(
        [],
        () => null,
        () => [0, 1],
      ),
    ).toBeNull()
  })
})
