import { describe, expect, it } from 'vitest'
import {
  applyPriorities,
  defaultOn,
  hasPriorities,
  isIncluded,
  musclesOf,
  optionalsOf,
  prioritySummary,
  type PriorityChoice,
} from './priorities.ts'

const ex = (name: string, muscle: string, optional = false) => ({ name, muscle, optional })
const program = {
  blocks: [
    {
      weeks: [
        {
          days: [
            {
              name: 'Empuje A',
              exercises: [ex('Press banca', 'Pecho'), ex('Press militar', 'Hombro anterior', true)],
            },
            { name: 'Tirón A', exercises: [ex('Remo', 'Dorsal'), ex('Vuelos', 'Hombro posterior', true)] },
            {
              name: 'Pierna A',
              exercises: [ex('Sentadilla', 'Cuádriceps'), ex('Aducción', 'Aductores', true)],
            },
            { name: 'Empuje B', exercises: [ex('Press militar', 'Hombro anterior', true)] },
          ],
        },
      ],
    },
  ],
}
const names = (p: typeof program) =>
  p.blocks[0].weeks[0].days.flatMap((d) => ('exercises' in d ? d.exercises.map((e) => e.name) : []))
const none: PriorityChoice = { priorities: [], optionals: {} }

describe('prioridades de MUTA', () => {
  it('lista los opcionales distintos y los músculos', () => {
    expect(optionalsOf(program).map((o) => o.key)).toEqual([
      'Hombro anterior|Press militar',
      'Hombro posterior|Vuelos',
      'Aductores|Aducción',
    ])
    expect(optionalsOf(program)[0].days).toEqual(['Empuje A', 'Empuje B'])
    expect(musclesOf(program)).toContain('Pecho')
    expect(hasPriorities(program)).toBe(true)
    expect(hasPriorities({ blocks: [] })).toBe(false)
  })

  it('por defecto: hombro anterior solo si es prioridad; posterior fuera para principiantes', () => {
    expect(defaultOn('Hombro anterior', false, 'intermediate')).toBe(false)
    expect(defaultOn('Hombro anterior', true, 'beginner')).toBe(true)
    expect(defaultOn('Hombro posterior', false, 'beginner')).toBe(false)
    expect(defaultOn('Hombro posterior', false, 'intermediate')).toBe(true)
    expect(defaultOn('Hombro posterior', true, 'beginner')).toBe(true)
    expect(defaultOn('Aductores', false, 'beginner')).toBe(true)
  })

  it('aplica las reglas sin elegir nada, y quita todos los repetidos', () => {
    expect(names(applyPriorities(program, null, 'beginner') as never)).toEqual([
      'Press banca',
      'Remo',
      'Sentadilla',
      'Aducción',
    ])
    expect(names(applyPriorities(program, null, 'intermediate') as never)).toEqual([
      'Press banca',
      'Remo',
      'Vuelos',
      'Sentadilla',
      'Aducción',
    ])
  })

  it('una prioridad mete su opcional (en todos los días donde sale)', () => {
    const out = applyPriorities(program, { ...none, priorities: ['Hombro anterior'] }, 'intermediate')
    expect(names(out as never)).toEqual([
      'Press banca',
      'Press militar',
      'Remo',
      'Vuelos',
      'Sentadilla',
      'Aducción',
      'Press militar',
    ])
  })

  it('lo que decides a mano manda sobre las reglas', () => {
    const choice: PriorityChoice = {
      priorities: [],
      optionals: { 'Aductores|Aducción': false, 'Hombro anterior|Press militar': true },
    }
    const o = optionalsOf(program)
    expect(isIncluded(o[2], choice, 'beginner')).toBe(false)
    expect(isIncluded(o[0], choice, 'beginner')).toBe(true)
  })

  it('resume lo elegido', () => {
    expect(prioritySummary(null)).toEqual([])
    expect(
      prioritySummary({ priorities: ['Pecho', 'Bíceps'], optionals: { a: true, b: false, c: false } }),
    ).toEqual(['Prioridad: Pecho, Bíceps', 'Opcionales a tu gusto: 1 añadidos · 2 quitados'])
  })
})
