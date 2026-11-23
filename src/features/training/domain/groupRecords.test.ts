import { describe, expect, it } from 'vitest'
import { recordsPorGrupo } from './groupRecords.ts'
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

describe('recordsPorGrupo', () => {
  it('el básico que más repites (los compuestos primero) o el elegido, con su mejor serie', () => {
    const r = recordsPorGrupo(
      [...lista, entreno('2026-11-10', [['Aperturas', [serie(20, 12)], 'pecho']])],
      {},
      (_, m) => m,
      (n) => n !== 'Aperturas',
    )
    const pecho = r.find((x) => x.grupo === 'pecho')
    expect(pecho).toMatchObject({
      basico: 'Press',
      elegido: false,
      fecha: '2026-11-09',
      hechos: ['Press', 'Aperturas'],
    })
    expect(pecho?.serie).toEqual(serie(65, 8, 3))
    expect(r.find((x) => x.grupo === 'gemelo')).toMatchObject({ basico: null, serie: null })
    const elegido = recordsPorGrupo(
      lista,
      { pecho: 'Aperturas' },
      (_, m) => m,
      () => true,
    )
    expect(elegido[0]).toMatchObject({ basico: 'Aperturas', elegido: true, serie: null })
  })
})
