import { describe, expect, it } from 'vitest'
import { applySwaps } from './swaps.ts'

const program = {
  blocks: [
    {
      weeks: [
        {
          days: [
            {
              name: 'Día 1',
              exercises: [
                { name: 'Sentadilla', substitutions: ['Prensa', 'Hack'] },
                { name: 'Curl', substitutions: [] },
              ],
            },
          ],
        },
      ],
    },
  ],
}
const rows = (p: typeof program) =>
  p.blocks[0].weeks[0].days[0].exercises as { name: string; slot?: unknown }[]

describe('sustituciones', () => {
  it('marca las filas con sustitutos y deja el original mientras no elijas', () => {
    const out = rows(applySwaps(program, null))
    expect(out[0].name).toBe('Sentadilla')
    expect(out[0].slot).toEqual({
      kind: 'swap',
      key: 'Sentadilla',
      options: ['Prensa', 'Hack'],
      chosen: null,
    })
    expect(out[1].slot).toBeUndefined()
  })

  it('pone el sustituto elegido y no admite uno que el programa no da', () => {
    expect(rows(applySwaps(program, { Sentadilla: 'Hack' }))[0].name).toBe('Hack')
    expect(rows(applySwaps(program, { Sentadilla: 'Inventado' }))[0].name).toBe('Sentadilla')
  })
})
