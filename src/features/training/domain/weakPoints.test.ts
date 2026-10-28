import { describe, expect, it } from 'vitest'
import {
  applyWeakPoints,
  hasWeakPoints,
  isComplete,
  weakNeeds,
  weakSummary,
  type WeakChoice,
  type WeakTable,
} from './weakPoints.ts'

const ex = (name: string) => ({ name, originalName: name, sets: 3, reps: '8-12', rpe: '8', rest: '2 min' })
const day = (name: string, ...names: string[]) => ({ name, exercises: names.map(ex) })
const opt = (en: string) => ({ en, es: `ES ${en}` })

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
const cuerpo = (optional: boolean) => ({
  weakPoints: TABLE,
  blocks: [
    {
      title: null,
      weeks: [
        {
          week: 1,
          days: [
            day(
              'Brazos',
              optional ? 'Weak Point Exercise 1 (optional)' : 'Weak Point Exercise 1',
              'Weak Point Exercise 2 (optional)',
              'Curl',
            ),
          ],
        },
      ],
    },
  ],
})
const names = (p: ReturnType<typeof cuerpo>) =>
  p.blocks[0].weeks[0].days.flatMap((d) => ('exercises' in d ? d.exercises.map((e) => e.name) : []))

describe('puntos débiles · tabla (Culturismo)', () => {
  it('el ejercicio 1 es obligatorio si la rutina no lo marca opcional; el 2 siempre es opcional', () => {
    expect(weakNeeds(cuerpo(false))).toEqual({ e1Optional: false })
    expect(weakNeeds(cuerpo(true))).toEqual({ e1Optional: true })
  })

  it('completa solo con lo obligatorio elegido', () => {
    const solo: WeakChoice = { mode: 'table', muscle: 'hombros', e1: null, e2: null }
    expect(isComplete(TABLE, solo, { e1Optional: false })).toBe(false)
    expect(isComplete(TABLE, solo, { e1Optional: true })).toBe(true)
    expect(isComplete(TABLE, { ...solo, e1: 'Lateral A' }, { e1Optional: false })).toBe(true)
    expect(isComplete(TABLE, { ...solo, e1: 'Inventado' }, { e1Optional: false })).toBe(false)
    expect(isComplete(TABLE, null, { e1Optional: true })).toBe(false)
  })

  it('un músculo que solo lleva consejo no pide ejercicio', () => {
    const c: WeakChoice = { mode: 'table', muscle: 'isquios', e1: null, e2: null }
    expect(isComplete(TABLE, c, { e1Optional: false })).toBe(true)
  })

  it('pone los ejercicios elegidos y quita el hueco opcional que no se usa', () => {
    const p = cuerpo(false)
    const out = applyWeakPoints(p, TABLE, { mode: 'table', muscle: 'hombros', e1: 'Lateral B', e2: null })
    expect(names(out as never)).toEqual(['ES Lateral B', 'Curl'])
    const both = applyWeakPoints(p, TABLE, {
      mode: 'table',
      muscle: 'hombros',
      e1: 'Lateral A',
      e2: 'Press A',
    })
    expect(names(both as never)).toEqual(['ES Lateral A', 'ES Press A', 'Curl'])
  })

  it('sin elegir, los huecos se quedan como están; con un músculo de solo consejo, desaparecen', () => {
    const p = cuerpo(false)
    expect(applyWeakPoints(p, TABLE, null)).toBe(p)
    const out = applyWeakPoints(p, TABLE, { mode: 'table', muscle: 'isquios', e1: null, e2: null })
    expect(names(out as never)).toEqual(['Curl'])
  })

  it('resume la elección', () => {
    expect(weakSummary(TABLE, { mode: 'table', muscle: 'hombros', e1: 'Lateral A', e2: 'Press A' })).toEqual([
      'Hombros · ES Lateral A + ES Press A',
    ])
    expect(hasWeakPoints(cuerpo(false))).toBe(true)
    expect(hasWeakPoints({ blocks: [] })).toBe(false)
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
    { id: 'abs', label: 'Abdomen', group: 'lower', advice: null, e1: [opt('Crunch')], e2: [] },
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

describe('puntos débiles · elegir 2 o 3 (Torso y pierna)', () => {
  const need = { e1Optional: false }
  it('pide entre 2 y 3 músculos, al menos uno de torso y uno de pierna', () => {
    const pick = (...m: [string, string][]): WeakChoice => ({
      mode: 'pick',
      picks: m.map(([muscle, option]) => ({ muscle, option })),
    })
    expect(isComplete(PICK, pick(['pecho', 'Fly']), need)).toBe(false)
    expect(isComplete(PICK, pick(['pecho', 'Fly'], ['biceps', 'Curl X']), need)).toBe(false)
    expect(isComplete(PICK, pick(['pecho', 'Fly'], ['gemelos', 'Calf']), need)).toBe(true)
    expect(
      isComplete(
        PICK,
        pick(['pecho', 'Fly'], ['biceps', 'Curl X'], ['gemelos', 'Calf'], ['abs', 'Crunch']),
        need,
      ),
    ).toBe(false)
    expect(isComplete(PICK, pick(['pecho', 'Fly'], ['gemelos', 'Otro']), need)).toBe(false)
  })

  it('reparte los músculos por orden entre los huecos, igual todas las semanas', () => {
    const out = applyWeakPoints(torso as never, PICK, {
      mode: 'pick',
      picks: [
        { muscle: 'pecho', option: 'Fly' },
        { muscle: 'biceps', option: 'Curl X' },
        { muscle: 'gemelos', option: 'Calf' },
      ],
    })
    const week = (i: number) =>
      out.blocks[0].weeks[i].days.map((d) => ('exercises' in d ? d.exercises[0].name : ''))
    expect(week(0)).toEqual(['ES Fly', 'ES Calf', 'ES Curl X'])
    expect(week(1)).toEqual(['ES Fly', 'ES Calf', 'ES Curl X'])
  })

  it('con dos músculos de pierna, se alternan por semana', () => {
    const out = applyWeakPoints(torso as never, PICK, {
      mode: 'pick',
      picks: [
        { muscle: 'pecho', option: 'Fly' },
        { muscle: 'gemelos', option: 'Calf' },
        { muscle: 'abs', option: 'Crunch' },
      ],
    })
    const lower = out.blocks[0].weeks.map((w) =>
      'exercises' in w.days[1] ? w.days[1].exercises[0].name : '',
    )
    expect(lower).toEqual(['ES Calf', 'ES Crunch'])
  })
})
