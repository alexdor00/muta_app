import { describe, expect, it } from 'vitest'
import { BIG, MUSCLE_IDS, MUSCLES, rangeFor } from './muscles.ts'

describe('tabla de músculos', () => {
  it('cada músculo tiene su etiqueta y rangos con mínimo ≤ máximo', () => {
    expect(MUSCLE_IDS).toHaveLength(16)
    for (const id of MUSCLE_IDS) {
      const m = MUSCLES[id]
      expect(m.label).not.toBe('')
      for (const [min, max] of [m.maintain, m.develop, m.priority]) expect(min).toBeLessThanOrEqual(max)
    }
  })

  it('los grupos grandes son músculos que existen', () => {
    for (const id of BIG) expect(MUSCLE_IDS).toContain(id)
  })

  it('mantener < desarrollar < prioridad en el máximo de cada músculo', () => {
    for (const id of MUSCLE_IDS) {
      const m = MUSCLES[id]
      expect(m.maintain[1]).toBeLessThanOrEqual(m.develop[1])
      expect(m.develop[1]).toBeLessThanOrEqual(m.priority[1])
    }
  })
})

describe('rango por nivel', () => {
  it('rangos por nivel de docs/conocimiento', () => {
    expect(rangeFor('pecho', 'intermediate')).toEqual([6, 10])
    expect(rangeFor('pecho', 'beginner')).toEqual([4, 8])
    expect(rangeFor('pecho', 'advanced')).toEqual([6, 12])
    expect(rangeFor('core', 'beginner')).toEqual([4, 6])
    expect(rangeFor('hombro_ant', 'beginner')).toEqual([1, 6])
  })

  it('mantener es igual para todos los niveles', () => {
    expect(rangeFor('pecho', 'beginner', 'maintain')).toEqual(rangeFor('pecho', 'advanced', 'maintain'))
  })

  it('avanzado sube el máximo: +2 en grandes y +1 en el resto al desarrollar', () => {
    expect(rangeFor('pecho', 'advanced')).toEqual([6, 12])
    expect(rangeFor('aductores', 'advanced')).toEqual([2, 9])
  })
})
