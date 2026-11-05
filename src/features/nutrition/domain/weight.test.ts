import { describe, expect, it } from 'vitest'
import { addDays } from '../../../shared/lib/format.ts'
import { deLosUltimos, gastoMedido, ritmoSemanal, tendencia, type Pesaje } from './weight.ts'

const HOY = '2026-11-05'

/** Un pesaje al día durante `n` días hasta hoy, bajando `porDia` kg cada día. */
function bajando(n: number, desde: number, porDia: number): Pesaje[] {
  return Array.from({ length: n }, (_, i) => ({ date: addDays(HOY, i - n + 1), kg: desde - porDia * i }))
}

describe('tendencia', () => {
  it('empieza en el primer pesaje y se mueve un 15 % hacia cada nuevo, por fecha', () => {
    const t = tendencia([
      { date: '2026-11-02', kg: 81 },
      { date: '2026-11-01', kg: 80 },
    ])
    expect(t.map((p) => p.tendencia)).toEqual([80, 80.15])
  })
})

describe('deLosUltimos', () => {
  it('cuenta hoy y los días de antes', () => {
    const lista = [{ date: '2026-10-22' }, { date: '2026-10-23' }, { date: HOY }, { date: '2026-11-06' }]
    expect(deLosUltimos(lista, HOY, 14)).toEqual([{ date: '2026-10-23' }, { date: HOY }])
  })
})

describe('ritmoSemanal', () => {
  it('con una bajada constante, el ritmo de esa bajada (en kg y en % del peso)', () => {
    const serie = bajando(30, 81, 0.04).map((p) => ({ ...p, tendencia: p.kg }))
    const r = ritmoSemanal(serie, HOY)
    expect(r?.kgSemana).toBe(-0.28)
    expect(r?.pctSemana).toBeCloseTo(-0.35, 2)
  })
  it('sin 4 pesajes en 6 días o más, no hay ritmo', () => {
    const pocos = tendencia(bajando(3, 80, 0.1))
    expect(ritmoSemanal(pocos, HOY)).toBeNull()
    const juntos = tendencia(bajando(5, 80, 0.1))
    expect(ritmoSemanal(juntos, HOY)).toBeNull()
  })
})

describe('gastoMedido', () => {
  it('comida media menos el cambio de peso (7.700 kcal por kilo)', () => {
    const serie = bajando(14, 81, 0.04).map((p) => ({ ...p, tendencia: p.kg }))
    const dias = Array.from({ length: 14 }, (_, i) => ({ date: addDays(HOY, -i), kcal: 2200 }))
    expect(gastoMedido({ serie, dias, hoy: HOY, basal: 1780 })).toBe(2508)
  })
  it('sin 8 pesajes y 8 días de comida, no se mide', () => {
    const serie = tendencia(bajando(7, 80, 0.05))
    const dias = Array.from({ length: 14 }, (_, i) => ({ date: addDays(HOY, -i), kcal: 2200 }))
    expect(gastoMedido({ serie, dias, hoy: HOY, basal: 1780 })).toBeNull()
  })
})
