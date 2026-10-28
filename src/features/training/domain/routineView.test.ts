import { describe, expect, it } from 'vitest'
import type { CatalogEntry } from './catalog.ts'
import type { ProgramInfo } from './programInfo.ts'
import {
  activeFilters,
  durationOf,
  matches,
  metaLines,
  restNote,
  rirLabel,
  routineView,
} from './routineView.ts'

const entry: CatalogEntry = { id: 'x', title: 'X', days: [4], tone: 1, origin: 'muta', family: 'muta' }
const info = (over: Partial<ProgramInfo> = {}): ProgramInfo => ({
  sets: {},
  volume: 'medio',
  volumeRatio: 0.9,
  emphasis: [],
  minutes: 60,
  setsPerExercise: 3,
  strengthShare: 0,
  equipment: 'gym',
  split: 'cuerpo-completo',
  splitLabel: 'Cuerpo completo',
  weeks: 10,
  phases: [],
  cycle: { sessions: 4, rests: 0, rotating: false, restNotes: [] },
  ...over,
})

describe('datos de la fila', () => {
  it('volumen, reparto y material; días, duración y semanas', () => {
    expect(metaLines(entry, info())).toEqual([
      'Volumen medio · Cuerpo completo · Gimnasio',
      '4 días · ~60 min · 10 semanas',
    ])
  })

  it('rutinas que rotan, plantillas sin fin y fases', () => {
    const [, rot] = metaLines(
      entry,
      info({ cycle: { sessions: 8, rests: 4, rotating: true, restNotes: [] } }),
    )
    expect(rot).toBe('rota en 8 sesiones · ~60 min · 10 semanas')
    expect(metaLines(entry, info({ weeks: 0 }))[1]).toBe('4 días · ~60 min · Sin fecha de fin')
    expect(metaLines(entry, info({ phases: ['A', 'B', 'C'], weeks: 13 }))[1]).toBe(
      '4 días · ~60 min · 3 fases · 13 semanas',
    )
  })
})

describe('filtros', () => {
  it('duración: corta ≤ 45, media hasta 65, larga desde 70', () => {
    expect([40, 45, 50, 65, 70].map(durationOf)).toEqual(['corta', 'corta', 'media', 'media', 'larga'])
  })

  it('cada filtro deja pasar solo lo que cumple', () => {
    const item = { entry, info: info() }
    expect(matches(item, {})).toBe(true)
    expect(
      matches(item, {
        days: 4,
        split: 'cuerpo-completo',
        duration: 'media',
        volume: 'medio',
        cycle: 'semanal',
      }),
    ).toBe(true)
    expect(matches(item, { days: 3 })).toBe(false)
    expect(matches(item, { cycle: 'rota' })).toBe(false)
    expect(activeFilters({ days: 4, volume: 'bajo' })).toBe(2)
  })
})

describe('detalle', () => {
  it('descansos en lenguaje claro', () => {
    expect(restNote('Obligatorio: 1-2 días de descanso')).toBe('Descanso · 1–2 días')
    expect(restNote('Optional días de descanso')).toBe('Descanso opcional')
  })

  it('adaptada: marca lo que cambia y resume las series por músculo', () => {
    const ex = (name: string, sets: number) => ({
      name,
      originalName: name,
      sets,
      reps: '8-10',
      rpe: '9',
      percent1RM: null,
      rest: '2 min',
      kind: 'compound' as const,
    })
    const program = {
      blocks: [
        {
          title: null,
          weeks: [
            {
              week: 1,
              days: [
                {
                  name: 'Cuerpo completo',
                  exercises: [ex('Bench Press', 4), ex('Incline DB Press', 4), ex('Machine Chest Press', 4)],
                },
                { rest: true as const, note: '1-2 días' },
              ],
            },
          ],
        },
      ],
    }
    const original = routineView(program, 2, null)
    expect(original.changes).toEqual([])
    const adapted = routineView(program, 2, { level: 'beginner', goal: 'develop' })
    expect(adapted.changes[0]).toMatchObject({ muscle: 'Pecho', before: 12 })
    const session = adapted.phases[0].weeks[0].days[0]
    expect(session.type === 'session' && session.exercises.some((e) => e.status === 'changed')).toBe(true)
    expect(adapted.phases[0].weeks[0].days[1]).toEqual({ type: 'rest', note: 'Descanso · 1–2 días' })
  })
})

describe('esfuerzo en RIR', () => {
  it('convierte el RPE del programa a repeticiones en reserva', () => {
    expect(rirLabel('8')).toBe('RIR 2')
    expect(rirLabel('7-8')).toBe('RIR 2-3')
    expect(rirLabel('~9-10')).toBe('RIR ~0-1')
    expect(rirLabel('RPE8')).toBe('RIR 2')
    expect(rirLabel('8.5')).toBe('RIR 1.5')
    expect(rirLabel('N/A')).toBe('N/A')
  })
})
