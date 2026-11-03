import { describe, expect, it } from 'vitest'
import { applyChoices } from './planProgram.ts'
import { isSession, type ProgramData } from './program.ts'

// Una rutina pequeña con dos opcionales de MUTA (hombro y gemelo) y un «(optional)» de un original
const ex = (name: string, muscle: string, optional = false) => ({
  name,
  muscle,
  optional,
  sets: 3,
  rest: '~2 min',
  kind: 'compound' as const,
})
const muta: ProgramData = {
  blocks: [
    {
      weeks: [
        {
          week: 1,
          days: [
            {
              name: 'A1 · Empuje',
              exercises: [
                ex('Press banca', 'Pecho'),
                ex('Press militar en máquina', 'Hombro anterior', true),
                ex('Elevación de talones', 'Gemelo', true),
              ],
            },
          ],
        },
      ],
    },
  ],
}

const opcionales = (p: ProgramData) =>
  p.blocks[0].weeks[0].days
    .filter(isSession)
    .flatMap((d) => d.exercises.filter((e) => e.slot?.kind === 'optional'))
const encendidos = (p: ProgramData) =>
  opcionales(p)
    .filter((e) => e.slot?.kind === 'optional' && !e.slot.off)
    .map((e) => e.name)

describe('applyChoices', () => {
  it('marca los opcionales de MUTA sin tocar el original', () => {
    const plan = applyChoices(muta, { weakPoints: null, priorities: null }, 'intermediate')
    expect(opcionales(plan)).toHaveLength(2)
    expect(opcionales(muta)).toHaveLength(0)
  })

  it('lo que decides a mano manda sobre las reglas', () => {
    const [primero] = opcionales(applyChoices(muta, { weakPoints: null, priorities: null }, 'intermediate'))
    if (primero.slot?.kind !== 'optional') throw new Error('sin opcional')
    const { key, off } = primero.slot
    const aMano = applyChoices(
      muta,
      { weakPoints: null, priorities: { priorities: [], optionals: { [key]: off } } },
      'intermediate',
    )
    expect(encendidos(aMano).includes(primero.name)).toBe(off)
  })
})
