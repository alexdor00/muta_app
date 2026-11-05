import { describe, expect, it } from 'vitest'
import { letraDia, resumenSemana, ultimosDias } from './week.ts'

const HOY = '2026-11-05'

describe('ultimosDias', () => {
  it('del más antiguo a hoy', () => {
    expect(ultimosDias(HOY, 3)).toEqual(['2026-11-03', '2026-11-04', HOY])
  })
})

describe('resumenSemana', () => {
  it('media sin hoy ni los días sin apuntar, y días con la proteína hecha', () => {
    const r = resumenSemana(
      {
        '2026-10-30': { kcal: 2240, protein: 150 },
        '2026-10-31': { kcal: 2410, protein: 130 },
        '2026-11-04': { kcal: 1980, protein: 145 },
        [HOY]: { kcal: 1369, protein: 100 },
      },
      HOY,
      { kcal: 2260, protein: 144 },
    )
    expect(r.dias).toHaveLength(7)
    expect(r.dias[6]).toEqual({ date: HOY, kcal: 1369, protein: 100, hoy: true, apuntado: true })
    expect(r.dias[2].apuntado).toBe(false)
    expect([r.media, r.cumplido, r.contados, r.conProteina]).toEqual([2210, 0.98, 3, 2])
  })
  it('sin nada apuntado, sin media', () => {
    expect(resumenSemana({}, HOY, { kcal: 2000, protein: 100 }).media).toBeNull()
  })
})

describe('letraDia', () => {
  it('la letra de cada día, con X para el miércoles', () => {
    expect(ultimosDias(HOY, 7).map(letraDia)).toEqual(['V', 'S', 'D', 'L', 'M', 'X', 'J'])
  })
})
