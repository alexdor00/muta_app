import { describe, expect, it } from 'vitest'
import { applyMarkedOptionals, hasMarkedOptionals } from './optionals.ts'

const ex = (name: string, originalName = name) => ({ name, originalName })
const program = {
  blocks: [
    {
      weeks: [
        {
          week: 1,
          days: [
            {
              name: 'Día 1',
              exercises: [
                ex('Press', 'Bench press'),
                ex('Cuello (opcional)', 'Neck flexion/extension (optional)'),
                ex('Ejercicio de punto débil (opcional)', 'Weak Point Exercise 2 (optional)'),
              ],
            },
            { rest: true as const },
          ],
        },
      ],
    },
  ],
}
const rows = (p: typeof program) => p.blocks[0].weeks[0].days[0] as { exercises: { slot?: unknown }[] }

describe('opcionales marcados en el documento original', () => {
  it('solo marca los «(optional)» y deja aparte los huecos de punto débil', () => {
    expect(hasMarkedOptionals(program)).toBe(true)
    expect(hasMarkedOptionals({ blocks: [] })).toBe(false)
    const out = rows(applyMarkedOptionals(program, null))
    expect(out.exercises[0].slot).toBeUndefined()
    expect(out.exercises[1].slot).toMatchObject({ kind: 'optional', off: false })
    expect(out.exercises[2].slot).toBeUndefined()
  })

  it('por defecto se hacen y se quitan solo si lo decides', () => {
    const key = 'Neck flexion/extension (optional)'
    const off = rows(applyMarkedOptionals(program, { priorities: [], optionals: { [key]: false } }))
    expect(off.exercises[1].slot).toMatchObject({ off: true, why: 'hand' })
    const on = rows(applyMarkedOptionals(program, { priorities: [], optionals: { [key]: true } }))
    expect(on.exercises[1].slot).toMatchObject({ off: false })
  })
})
