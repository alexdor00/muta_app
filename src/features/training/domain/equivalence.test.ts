import { describe, expect, it } from 'vitest'
import type { LibraryExercise } from './exerciseLibrary.ts'
import { equivalentes, zonaDe } from './equivalence.ts'

const ex = (
  id: string,
  name: string,
  primary: LibraryExercise['primary'],
  kind: LibraryExercise['kind'],
  pattern = 'aislamiento',
  contributes: LibraryExercise['contributes'] = {},
): LibraryExercise => ({
  id,
  name,
  primary,
  contributes: { [primary]: 1, ...contributes },
  kind,
  equipment: 'dumbbell',
  pattern,
  gyms: ['gym'],
  reps: [8, 12],
  rir: 1,
  restSec: 90,
  stepKg: 2,
  heavy: false,
  stable: true,
  key: '',
  source: '',
})

const BIBLIOTECA = [
  ex('curl_inclinado', 'Curl inclinado con mancuernas', 'biceps', 'isolation'),
  ex('bayesian', 'Curl bayesian en polea', 'biceps', 'isolation'),
  ex('scott', 'Curl predicador (Scott)', 'biceps', 'isolation'),
  ex('curl_barra', 'Curl con barra', 'biceps', 'isolation'),
  ex('rumano', 'Peso muerto rumano', 'femoral', 'compound', 'bisagra', { gluteo: 0.5 }),
  ex('buenos_dias', 'Buenos días', 'femoral', 'compound', 'bisagra'),
  ex('curl_femoral', 'Curl femoral tumbado', 'femoral', 'isolation'),
  ex('laterales', 'Elevaciones laterales con mancuernas', 'hombro_lat', 'isolation'),
  ex('laterales_polea', 'Elevaciones laterales en polea', 'hombro_lat', 'isolation'),
  ex('press_militar', 'Press militar', 'hombro_ant', 'compound', 'empuje_v'),
]

describe('zonaDe', () => {
  it('la zona sale del nombre, también del original en inglés', () => {
    expect(zonaDe('biceps', 'Curl por detrás del cuerpo en polea')?.id).toBe('estirado')
    expect(zonaDe('biceps', 'Curl araña')?.id).toBe('acortado')
    expect(zonaDe('triceps', 'Extensión rara', 'Overhead cable triceps extension')?.id).toBe('larga')
    expect(zonaDe('gluteo', 'Puente rana lastrado')?.id).toBe('acortado')
    expect(zonaDe('gluteo', 'Sentadilla búlgara')?.id).toBe('estirado')
    expect(zonaDe('hombro_lat', 'Elevaciones laterales')).toBeNull()
  })
})

describe('equivalentes', () => {
  it('mismo músculo y misma zona: un curl estirado se cambia por otro estirado, no por el predicador', () => {
    const r = equivalentes(
      {
        nombre: 'Curl sentado muy por detrás del cuerpo en polea alta',
        musculo: 'biceps',
        compuesto: false,
        secundarios: [],
      },
      BIBLIOTECA,
    )
    expect(r.map((x) => x.ex.id)).toEqual(['bayesian', 'curl_inclinado'])
    expect(r[0].motivo).toBe('Bíceps · estirado (brazo por detrás) · aislamiento')
  })

  it('una bisagra rara se cambia por bisagras, primero las que comparten secundarios', () => {
    const r = equivalentes(
      {
        nombre: 'Peso muerto sumo piernas rígidas con mancuernas',
        musculo: 'femoral',
        compuesto: true,
        secundarios: ['gluteo'],
        patron: 'bisagra',
      },
      BIBLIOTECA,
    )
    expect(r.map((x) => x.ex.id)).toEqual(['rumano', 'buenos_dias'])
  })

  it('sin zonas, todos los del mismo músculo; sin músculo, ninguno; nunca el mismo ejercicio', () => {
    const r = equivalentes(
      {
        nombre: 'Elevaciones laterales con mancuernas',
        musculo: 'hombro_lat',
        compuesto: false,
        secundarios: [],
      },
      BIBLIOTECA,
    )
    expect(r.map((x) => x.ex.id)).toEqual(['laterales_polea'])
    expect(
      equivalentes({ nombre: 'Bird dog', musculo: null, compuesto: false, secundarios: [] }, BIBLIOTECA),
    ).toEqual([])
  })
})
