import { describe, expect, it } from 'vitest'
import { applyWeakPoints, dropEmptyHoles, hasWeakPoints, type WeakTable } from './weakPoints.ts'

const ex = (name: string) => ({ name, originalName: name, sets: 3, reps: '8-12', rpe: '8', rest: '2 min' })
const day = (name: string, ...names: string[]) => ({ name, exercises: names.map(ex) })
const opt = (en: string) => ({ en, es: `ES ${en}` })
const rowsOf = (p: { blocks: { weeks: { days: unknown[] }[] }[] }, week = 0) =>
  p.blocks[0].weeks[week].days.flatMap(
    (d) => (d as { exercises?: { name: string; slot?: unknown }[] }).exercises ?? [],
  )

const TABLE: WeakTable = {
  mode: 'table',
  muscles: [
    {
      id: 'hombros',
      label: 'Hombros',
      advice: null,
      e1: [opt('Lateral A'), opt('Lateral B')],
      e2: [opt('Press A')],
    },
    { id: 'isquios', label: 'Isquiotibiales', advice: 'Ya lleva mucho volumen.', e1: [], e2: [] },
  ],
}
const cuerpo = {
  weakPoints: TABLE,
  blocks: [
    {
      title: null,
      weeks: [
        {
          week: 1,
          days: [day('Brazos', 'Weak Point Exercise 1', 'Weak Point Exercise 2 (optional)', 'Curl')],
        },
      ],
    },
  ],
}

describe('puntos débiles · tabla (Culturismo)', () => {
  it('los huecos se ven marcados y «a elegir» mientras no elijas', () => {
    const out = applyWeakPoints(cuerpo, TABLE, null)
    expect(rowsOf(out).map((e) => e.name)).toEqual([
      'Weak Point Exercise 1',
      'Weak Point Exercise 2 (optional)',
      'Curl',
    ])
    expect(rowsOf(out)[0].slot).toEqual({ kind: 'weak', which: 1, filled: false })
    expect(rowsOf(out)[2].slot).toBeUndefined()
    expect(hasWeakPoints(cuerpo)).toBe(true)
    expect(hasWeakPoints({ blocks: [] })).toBe(false)
  })

  it('pone el ejercicio elegido en su hueco y deja el otro a elegir', () => {
    const out = applyWeakPoints(cuerpo, TABLE, {
      mode: 'table',
      muscle: 'hombros',
      e1: 'Lateral B',
      e2: null,
    })
    expect(rowsOf(out).map((e) => e.name)).toEqual([
      'ES Lateral B',
      'Weak Point Exercise 2 (optional)',
      'Curl',
    ])
    expect(rowsOf(out)[0].slot).toEqual({ kind: 'weak', which: 1, filled: true })
    expect(rowsOf(out)[1].slot).toEqual({ kind: 'weak', which: 2, filled: false })
  })

  it('el ejercicio 1 es libre: se puede elegir solo el 2', () => {
    const out = applyWeakPoints(cuerpo, TABLE, { mode: 'table', muscle: 'hombros', e1: null, e2: 'Press A' })
    expect(rowsOf(out).map((e) => e.name)).toEqual(['Weak Point Exercise 1', 'ES Press A', 'Curl'])
  })

  it('para entrenar, los huecos sin elegir se quitan', () => {
    const out = applyWeakPoints(cuerpo, TABLE, {
      mode: 'table',
      muscle: 'hombros',
      e1: 'Lateral A',
      e2: null,
    })
    expect(rowsOf(dropEmptyHoles(out)).map((e) => e.name)).toEqual(['ES Lateral A', 'Curl'])
    expect(rowsOf(dropEmptyHoles(applyWeakPoints(cuerpo, TABLE, null))).map((e) => e.name)).toEqual(['Curl'])
  })
})

const PICK: WeakTable = {
  mode: 'pick',
  min: 2,
  max: 3,
  muscles: [
    { id: 'pecho', label: 'Pecho', group: 'upper', advice: null, e1: [opt('Fly')], e2: [] },
    { id: 'biceps', label: 'Bíceps', group: 'upper', advice: null, e1: [opt('Curl X')], e2: [] },
    { id: 'gemelos', label: 'Gemelos', group: 'lower', advice: null, e1: [opt('Calf')], e2: [] },
  ],
}
const torso = {
  weakPoints: PICK,
  blocks: [
    {
      title: null,
      weeks: [1, 2].map((week) => ({
        week,
        days: [
          day('Torso 1', 'UPPER BODY WEAK POINT 1'),
          day('Pierna 1', 'LOWER BODY WEAK POINT 1'),
          day('Torso 2', 'UPPER BODY WEAK POINT 1'),
        ],
      })),
    },
  ],
}

describe('puntos débiles · un músculo por día (Torso y pierna)', () => {
  it('cada día con hueco se marca con su nombre', () => {
    const out = applyWeakPoints(torso, PICK, null)
    expect(rowsOf(out).map((e) => e.slot)).toEqual([
      { kind: 'pick', day: 'Torso 1', filled: false },
      { kind: 'pick', day: 'Pierna 1', filled: false },
      { kind: 'pick', day: 'Torso 2', filled: false },
    ])
  })

  it('el reparto lo decides tú: cualquier músculo en cualquier día, igual en todas las semanas', () => {
    const out = applyWeakPoints(torso, PICK, {
      mode: 'pick',
      slots: {
        'Torso 1': { muscle: 'gemelos', option: 'Calf' },
        'Torso 2': { muscle: 'pecho', option: 'Fly' },
        'Pierna 1': null,
      },
    })
    for (const week of [0, 1])
      expect(rowsOf(out, week).map((e) => e.name)).toEqual(['ES Calf', 'LOWER BODY WEAK POINT 1', 'ES Fly'])
  })

  it('una opción que no existe no se aplica', () => {
    const out = applyWeakPoints(torso, PICK, {
      mode: 'pick',
      slots: { 'Torso 1': { muscle: 'pecho', option: 'Inventado' } },
    })
    expect(rowsOf(out)[0].name).toBe('UPPER BODY WEAK POINT 1')
  })
})
