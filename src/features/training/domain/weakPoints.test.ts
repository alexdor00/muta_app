import { describe, expect, it } from 'vitest'
import {
  applyWeakPoints,
  autoSlots,
  hasWeakPoints,
  slotsOf,
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
const cuerpo = (first: string) => ({
  weakPoints: TABLE,
  blocks: [
    {
      title: null,
      weeks: [{ week: 1, days: [day('Brazos', first, 'Weak Point Exercise 2 (optional)', 'Curl')] }],
    },
  ],
})
const names = (p: ReturnType<typeof cuerpo>) =>
  p.blocks[0].weeks[0].days.flatMap((d) => ('exercises' in d ? d.exercises.map((e) => e.name) : []))

describe('puntos débiles · tabla (Culturismo)', () => {
  const p = cuerpo('Weak Point Exercise 1')

  it('pone los ejercicios elegidos y quita el hueco que no usas', () => {
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

  it('se puede dejar el ejercicio 1 sin elegir: nada es obligatorio', () => {
    const out = applyWeakPoints(p, TABLE, { mode: 'table', muscle: 'hombros', e1: null, e2: 'Press A' })
    expect(names(out as never)).toEqual(['ES Press A', 'Curl'])
  })

  it('sin elegir, los huecos se quedan; con un músculo de solo consejo, desaparecen', () => {
    expect(applyWeakPoints(p, TABLE, null)).toBe(p)
    const out = applyWeakPoints(p, TABLE, { mode: 'table', muscle: 'isquios', e1: null, e2: null })
    expect(names(out as never)).toEqual(['Curl'])
    expect(hasWeakPoints(p)).toBe(true)
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
const picks = [
  { muscle: 'pecho', option: 'Fly' },
  { muscle: 'biceps', option: 'Curl X' },
  { muscle: 'gemelos', option: 'Calf' },
]
const week = (p: { blocks: { weeks: { days: unknown[] }[] }[] }, i: number) =>
  p.blocks[0].weeks[i].days.map((d) => (d as { exercises?: { name: string }[] }).exercises?.[0]?.name ?? '—')

describe('puntos débiles · repartir músculos (Torso y pierna)', () => {
  it('encuentra los días con hueco y de qué lado son', () => {
    expect(slotsOf(torso as never)).toEqual([
      { key: 'Torso 1', side: 'upper' },
      { key: 'Pierna 1', side: 'lower' },
      { key: 'Torso 2', side: 'upper' },
    ])
  })

  it('reparte solo, por orden: torso en días de torso y pierna en días de pierna', () => {
    expect(autoSlots(PICK, picks, slotsOf(torso as never))).toEqual({
      'Torso 1': ['pecho'],
      'Pierna 1': ['gemelos'],
      'Torso 2': ['biceps'],
    })
    const out = applyWeakPoints(torso as never, PICK, { mode: 'pick', picks })
    expect(week(out, 0)).toEqual(['ES Fly', 'ES Calf', 'ES Curl X'])
    expect(week(out, 1)).toEqual(['ES Fly', 'ES Calf', 'ES Curl X'])
  })

  it('con menos músculos que días, se repiten; con más, se alternan por semana', () => {
    expect(autoSlots(PICK, [picks[0]], slotsOf(torso as never))).toEqual({
      'Torso 1': ['pecho'],
      'Pierna 1': [],
      'Torso 2': ['pecho'],
    })
    const dos = [picks[0], picks[2], { muscle: 'abs', option: 'Crunch' }]
    const out = applyWeakPoints(torso as never, PICK, { mode: 'pick', picks: dos })
    expect([week(out, 0)[1], week(out, 1)[1]]).toEqual(['ES Calf', 'ES Crunch'])
  })

  it('el reparto lo decides tú: cualquier músculo en cualquier día, o el día libre', () => {
    const choice: WeakChoice = {
      mode: 'pick',
      picks,
      slots: { 'Torso 1': ['gemelos'], 'Pierna 1': [], 'Torso 2': ['pecho', 'biceps'] },
    }
    const out = applyWeakPoints(torso as never, PICK, choice)
    expect(week(out, 0)).toEqual(['ES Calf', '—', 'ES Fly'])
    expect(week(out, 1)).toEqual(['ES Calf', '—', 'ES Curl X'])
  })

  it('sin elegir nada, los huecos se quitan o se quedan según haya elección', () => {
    expect(applyWeakPoints(torso as never, PICK, null)).toBe(torso)
    const out = applyWeakPoints(torso as never, PICK, { mode: 'pick', picks: [] })
    expect(week(out, 0)).toEqual(['—', '—', '—'])
  })
})
