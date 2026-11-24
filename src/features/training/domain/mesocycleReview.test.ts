import { describe, expect, it } from 'vitest'
import { balanceDe } from './mesocycleReview.ts'
import { resumenDe, type Mesociclo } from './mesocycles.ts'
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

describe('balance', () => {
  it('sin 3 sesiones no hay balance; con ellas, el peso frente al objetivo', () => {
    const r = resumenDe(meso('2026-11-02', null), lista, HOY)
    expect(
      balanceDe({
        resumen: { ...r, sesiones: 2 },
        semanas: 3,
        objetivo: 'bulk',
        peso: null,
        bajos: [],
        formato: String,
      }),
    ).toEqual([])
    const b = balanceDe({
      resumen: r,
      semanas: 3,
      objetivo: 'bulk',
      peso: { inicio: 80, fin: 80.6 },
      bajos: ['Pecho'],
      formato: (n) => n.toFixed(2),
    })
    // +0,25 % por semana en volumen: por encima de 0,8 % al mes (02-reglas § 8)
    expect(b.map((x) => x.tono)).toEqual(['aviso', 'normal'])
    expect(b[0].texto).toContain('no va acorde con tu objetivo')
    const lento = balanceDe({
      resumen: r,
      semanas: 4,
      objetivo: 'bulk',
      peso: { inicio: 80, fin: 80.2 },
      bajos: [],
      formato: String,
    })
    expect(lento[0]).toMatchObject({ tono: 'bien' })
    const corte = balanceDe({
      resumen: r,
      semanas: 4,
      objetivo: 'cut',
      peso: { inicio: 80, fin: 79.6 },
      bajos: [],
      formato: String,
    })
    expect(corte[0]).toMatchObject({ tono: 'aviso' })
  })

  it('estancado: 2 o más sesiones seguidas sin récord (02-reglas § 1)', () => {
    const mas = [...lista, entreno('2026-11-17', [['Press', [serie(62.5, 6)], 'pecho']])]
    const r = resumenDe(meso('2026-11-02', null), mas, HOY)
    expect(r.ejercicios.find((x) => x.nombre === 'Press')?.sinRecord).toBe(2)
  })

  it('no hace falta subir en todo: mantener la mayoría y subir en algunos es el punto dulce (04-guia § 5)', () => {
    const r = resumenDe(meso('2026-11-02', null), lista, HOY)
    const con = (suben: number, bajan: number, repetidos = 10) =>
      balanceDe({
        resumen: { ...r, sesiones: 6, suben, bajan, repetidos },
        semanas: 3,
        objetivo: null,
        peso: null,
        bajos: [],
        formato: String,
      })[0]
    expect(con(2, 0)).toMatchObject({ tono: 'bien', texto: expect.stringContaining('punto dulce') })
    expect(con(1, 1)).toMatchObject({ tono: 'bien', texto: expect.stringContaining('no tocar el volumen') })
    expect(con(8, 0)).toMatchObject({ tono: 'bien', texto: expect.stringContaining('subir el volumen') })
    expect(con(5, 2)).toMatchObject({
      tono: 'aviso',
      texto: expect.stringContaining('sueño, estrés y comida'),
    })
    expect(con(0, 0)).toMatchObject({ tono: 'normal', texto: expect.stringContaining('RIR') })
    // Con menos de 3 ejercicios repetidos no se juzga el progreso
    expect(con(0, 0, 2)).toBeUndefined()
  })
})
