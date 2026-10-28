import { describe, expect, it } from 'vitest'
import {
  applyPriorities,
  defaultOn,
  hasPriorities,
  isIncluded,
  limitOf,
  musclesOf,
  optionalsOf,
  type PriorityChoice,
} from './priorities.ts'
import type { Slot } from './slots.ts'

type Ex = {
  name: string
  muscle: string
  optional: boolean
  sets: number
  rest: string
  kind: 'compound'
  slot?: Slot
  [key: string]: unknown
}
const ex = (name: string, muscle: string, optional = false, sets = 3): Ex => ({
  name,
  muscle,
  optional,
  sets,
  rest: '~2 min',
  kind: 'compound',
})
const program = {
  blocks: [
    {
      weeks: [
        {
          days: [
            {
              name: 'Empuje A',
              exercises: [ex('Press banca', 'Pecho'), ex('Press militar', 'Hombro anterior', true, 2)],
            },
            { name: 'Tirón A', exercises: [ex('Remo', 'Dorsal'), ex('Vuelos', 'Hombro posterior', true, 2)] },
            {
              name: 'Pierna A',
              exercises: [ex('Sentadilla', 'Cuádriceps'), ex('Aducción', 'Aductores', true, 2)],
            },
            { name: 'Empuje B', exercises: [ex('Press militar', 'Hombro anterior', true, 2)] },
          ],
        },
      ],
    },
  ],
}
const names = (p: typeof program) =>
  p.blocks[0].weeks[0].days.flatMap((d) =>
    'exercises' in d ? d.exercises.filter(on).map((e) => e.name) : [],
  )
const on = (e: { slot?: { kind: string; off?: boolean } }) => !(e.slot?.kind === 'optional' && e.slot.off)
const none: PriorityChoice = { priorities: [], optionals: {}, maxMinutes: null }

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

  it('aplica las reglas sin elegir nada', () => {
    expect(names(applyPriorities(program, none, 'beginner') as never)).toEqual([
      'Press banca',
      'Remo',
      'Sentadilla',
      'Aducción',
    ])
    expect(names(applyPriorities(program, none, 'intermediate') as never)).toEqual([
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
      ...none,
      optionals: { 'Aductores|Aducción': false, 'Hombro anterior|Press militar': true },
    }
    const o = optionalsOf(program)
    expect(isIncluded(o[2], choice, 'beginner')).toBe(false)
    expect(isIncluded(o[0], choice, 'beginner')).toBe(true)
  })
})

describe('regla de tiempo (75 min por defecto)', () => {
  const day = (...exercises: ReturnType<typeof ex>[]) => ({
    blocks: [{ weeks: [{ days: [{ name: 'Día', exercises }] }] }],
  })
  const list = (p: ReturnType<typeof day>) =>
    p.blocks[0].weeks[0].days.flatMap((d) => ('exercises' in d ? d.exercises : []))
  const active = (p: ReturnType<typeof day>) => list(p).filter(on)
  // 8 + sets × 2,75 por ejercicio: 3+3 series = 24,5 min; con 2+2 de opcionales, 35,5 min
  const base = day(
    ex('A', 'Pecho'),
    ex('B', 'Dorsal'),
    ex('Opc 1', 'Aductores', true, 2),
    ex('Opc 2', 'Glúteo', true, 2),
  )

  it('sin límite explícito se usa 75 minutos; con null, ninguno', () => {
    expect(limitOf(null)).toBe(75)
    expect(limitOf({ priorities: [], optionals: {} })).toBe(75)
    expect(limitOf({ priorities: [], optionals: {}, maxMinutes: null })).toBeNull()
    expect(active(applyPriorities(base, { priorities: [], optionals: {} }, 'intermediate')).length).toBe(4)
  })

  it('quita primero el último opcional no prioritario', () => {
    const out = applyPriorities(base, { priorities: [], optionals: {}, maxMinutes: 29 }, 'intermediate')
    expect(active(out).map((e) => e.name)).toEqual(['A', 'B'])
    const one = applyPriorities(base, { priorities: [], optionals: {}, maxMinutes: 35 }, 'intermediate')
    expect(active(one).map((e) => e.name)).toEqual(['A', 'B', 'Opc 1'])
  })

  it('no toca los opcionales de tus prioridades ni los que pusiste a mano', () => {
    const out = applyPriorities(
      base,
      { priorities: ['Glúteo'], optionals: {}, maxMinutes: 30 },
      'intermediate',
    )
    expect(active(out).map((e) => e.name)).toEqual(['A', 'B', 'Opc 2'])
    const hand = applyPriorities(
      base,
      { priorities: [], optionals: { 'Aductores|Opc 1': true }, maxMinutes: 30 },
      'intermediate',
    )
    expect(active(hand).map((e) => e.name)).toEqual(['A', 'B', 'Opc 1'])
  })

  it('sin opcionales que quitar, resta una serie al ejercicio con más series no prioritario (mínimo 2)', () => {
    const p = day(ex('A', 'Pecho', false, 4), ex('B', 'Dorsal', false, 3))
    const out = applyPriorities(p, { priorities: [], optionals: {}, maxMinutes: 25 }, 'intermediate')
    expect(active(out).map((e) => e.sets)).toEqual([3, 3]) // 8 + 6 × 2,75 = 24,5 min
    const prio = applyPriorities(p, { priorities: ['Pecho'], optionals: {}, maxMinutes: 1 }, 'intermediate')
    expect(active(prio).map((e) => e.sets)).toEqual([4, 2]) // el prioritario no se toca; el otro baja hasta 2
  })
})

describe('los opcionales quitados no desaparecen', () => {
  it('se quedan en la rutina marcados con su motivo, para poder volver a ponerlos', () => {
    const out = applyPriorities(program, { priorities: [], optionals: {}, maxMinutes: null }, 'beginner')
    const pressMilitar = out.blocks[0].weeks[0].days
      .flatMap((d) => ('exercises' in d ? d.exercises : []))
      .find((e) => e.name === 'Press militar')
    expect(pressMilitar?.slot).toEqual({
      kind: 'optional',
      key: 'Hombro anterior|Press militar',
      off: true,
      why: 'rule',
    })
    const hand = applyPriorities(
      program,
      { priorities: [], optionals: { 'Aductores|Aducción': false }, maxMinutes: null },
      'intermediate',
    )
    const aduccion = hand.blocks[0].weeks[0].days
      .flatMap((d) => ('exercises' in d ? d.exercises : []))
      .find((e) => e.name === 'Aducción')
    expect(aduccion?.slot).toMatchObject({ off: true, why: 'hand' })
  })

  it('la regla de tiempo los marca como «time»', () => {
    const p = {
      blocks: [
        {
          weeks: [
            {
              days: [
                {
                  name: 'Día',
                  exercises: [ex('A', 'Pecho'), ex('B', 'Dorsal'), ex('Opc', 'Aductores', true, 2)],
                },
              ],
            },
          ],
        },
      ],
    }
    const out = applyPriorities(p, { priorities: [], optionals: {}, maxMinutes: 25 }, 'intermediate')
    expect(out.blocks[0].weeks[0].days[0].exercises[2].slot).toEqual({
      kind: 'optional',
      key: 'Aductores|Opc',
      off: true,
      why: 'time',
    })
  })
})
