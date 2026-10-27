import { describe, expect, it } from 'vitest'
import {
  adaptForBeginner,
  adaptProgramForBeginner,
  beginnerSets,
  type AdaptableExercise,
} from './adaptLevel.ts'

describe('ajuste para principiante', () => {
  it('series ×0,7 redondeadas, mínimo 1', () => {
    expect([1, 2, 3, 4, 5].map(beginnerSets)).toEqual([1, 1, 2, 3, 4])
  })

  it('compuesto pesado a RPE 7 (RIR 3), el resto a RPE 8 (RIR 2), guardando el original', () => {
    const heavy = adaptForBeginner({ sets: 4, rpe: '8', percent1RM: null, kind: 'heavy' as const })
    expect(heavy).toMatchObject({ sets: 3, rpe: '7', original: { sets: 4, rpe: '8' } })
    const iso = adaptForBeginner({ sets: 3, rpe: '9-10', percent1RM: null, kind: 'isolation' as const })
    expect(iso).toMatchObject({ sets: 2, rpe: '8', original: { sets: 3, rpe: '9-10' } })
  })

  it('con %1RM no toca el RPE', () => {
    const e = adaptForBeginner({ sets: 3, rpe: null, percent1RM: '75%', kind: 'heavy' as const })
    expect(e).toMatchObject({ sets: 2, rpe: null })
  })

  it('aplicarlo dos veces no reduce más: parte siempre del original', () => {
    const once = adaptForBeginner<AdaptableExercise>({
      sets: 4,
      rpe: '9',
      percent1RM: null,
      kind: 'compound',
    })
    const twice = adaptForBeginner({ ...once, sets: once.original!.sets })
    expect(twice.sets).toBe(3)
  })

  it('recorre todo el programa y respeta los días de descanso', () => {
    const program = {
      blocks: [
        {
          weeks: [
            {
              days: [
                { exercises: [{ sets: 3, rpe: '9', percent1RM: null, kind: 'compound' as const }] },
                { rest: true as const },
              ],
            },
          ],
        },
      ],
    }
    const out = adaptProgramForBeginner(program)
    expect(out.blocks[0].weeks[0].days[0]).toMatchObject({ exercises: [{ sets: 2, rpe: '8' }] })
    expect(out.blocks[0].weeks[0].days[1]).toEqual({ rest: true })
  })
})
