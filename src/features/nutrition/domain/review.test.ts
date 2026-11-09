import { describe, expect, it } from 'vitest'
import { addDays } from '../../../shared/lib/format.ts'
import { consejosDeLaSemana, revisar, ritmoPrevisto, tituloCambio, type DatosRevision } from './review.ts'

const HOY = '2026-11-05'

/** Pesajes diarios de 14 días con un ritmo de `kgSemana` (la tendencia sigue la recta). */
function serie(kgSemana: number, dias = 14) {
  return Array.from({ length: dias }, (_, i) => {
    const kg = 80.6 + (kgSemana / 7) * i
    return { date: addDays(HOY, i - dias + 1), kg, tendencia: kg }
  })
}
const comida = (kcal: number, n = 28) =>
  Array.from({ length: n }, (_, i) => ({ date: addDays(HOY, -i), kcal }))

const base: DatosRevision = {
  hoy: HOY,
  fase: 'definicion',
  ritmo: 0.75,
  kcal: 2260,
  suelo: 1958,
  pasos: 10300,
  serie: serie(-0.28),
  dias: comida(2200),
  ultimoCambio: '2026-10-03',
}

describe('ritmoPrevisto', () => {
  it('definición ±0,2; volumen 0,375 % al mes ±0,15; mantenimiento 0 ±0,15', () => {
    expect(ritmoPrevisto('definicion', 0.75)).toEqual({ centro: -0.75, min: -0.95, max: -0.55 })
    expect(ritmoPrevisto('volumen', 0.75)).toEqual({ centro: 0.09, min: -0.06, max: 0.24 })
    expect(ritmoPrevisto('mantenimiento', 0.75)).toEqual({ centro: 0, min: -0.15, max: 0.15 })
  })
})

describe('revisar', () => {
  it('en definición y lento, con los pasos hechos: propone −150 kcal', () => {
    const r = revisar(base)
    expect(r.tipo).toBe('cambio')
    if (r.tipo !== 'cambio') return
    expect([r.de, r.a, r.lento]).toEqual([2260, 2110, true])
    expect(r.comprobaciones.map((c) => c.texto)).toEqual([
      '14 pesajes en 14 días',
      'Comiste el 97 % de tu objetivo',
      '10.300 pasos al día: ya andas lo suficiente',
      '33 días sin cambios',
    ])
    expect(tituloCambio(r, 'definicion')).toBe('Bajas más despacio de lo previsto')
  })

  it('antes de comer menos, pasos', () => {
    expect(revisar({ ...base, pasos: 7000 }).tipo).toBe('pasos')
  })

  it('demasiado rápido: +150 kcal (en hidratos)', () => {
    const r = revisar({ ...base, serie: serie(-1.2) })
    expect(r.tipo === 'cambio' && [r.a, r.lento]).toEqual([2410, false])
  })

  it('al ritmo previsto: nada', () => {
    expect(revisar({ ...base, serie: serie(-0.6) }).tipo).toBe('bien')
  })

  it('sin datos suficientes dice cuánto falta', () => {
    expect(revisar({ ...base, serie: serie(-0.28, 8), dias: comida(2200, 5) })).toEqual({
      tipo: 'faltan',
      pesajes: 8,
      faltanPesajes: 2,
      dias: 5,
      faltanDias: 7,
    })
  })

  it('si no comes lo que marca el plan, primero cumplir', () => {
    expect(revisar({ ...base, dias: comida(1700) })).toEqual({ tipo: 'cumplir', cumplido: 0.75 })
  })

  it('10 días entre cambios', () => {
    expect(revisar({ ...base, ultimoCambio: '2026-10-30' })).toEqual({ tipo: 'esperar', dias: 4 })
  })

  it('nunca por debajo del suelo', () => {
    const r = revisar({ ...base, kcal: 2000 })
    expect(r.tipo === 'cambio' && r.a).toBe(1958)
    expect(revisar({ ...base, kcal: 1958 }).tipo).toBe('suelo')
  })

  it('volumen lento: +150; mantenimiento subiendo: −150', () => {
    const volumen = revisar({ ...base, fase: 'volumen', serie: serie(-0.3) })
    expect(volumen.tipo === 'cambio' && volumen.a).toBe(2410)
    const mantener = revisar({ ...base, fase: 'mantenimiento', serie: serie(0.4) })
    expect(mantener.tipo === 'cambio' && mantener.a).toBe(2110)
    if (mantener.tipo === 'cambio')
      expect(tituloCambio(mantener, 'mantenimiento')).toBe('Estás subiendo de peso')
  })

  it('volumen lento pero tu fuerza no baja: no se suben las kcal; si baja o no hay datos, +150', () => {
    const lento = { ...base, fase: 'volumen' as const, serie: serie(-0.3) }
    expect(revisar({ ...lento, fuerza: 0.02 }).tipo).toBe('progresas')
    expect(revisar({ ...lento, fuerza: 0 }).tipo).toBe('progresas')
    expect(revisar({ ...lento, fuerza: -0.03 }).tipo).toBe('cambio')
    expect(revisar({ ...lento, fuerza: null }).tipo).toBe('cambio')
  })
})

describe('velocidad por fases', () => {
  it('al llegar a la siguiente etapa propone su objetivo (más suave al final: más kcal)', () => {
    const r = revisar({
      ...base,
      porFases: true,
      pesoKg: 80,
      semanaFase: 9,
      ritmoAplicado: 0.75,
      serie: serie(-0.6),
    })
    expect(r.tipo).toBe('cambio')
    if (r.tipo !== 'cambio') return
    expect(r.extra).toEqual({ ritmoTramo: 0.5 })
    expect(r.a).toBeGreaterThan(r.de)
    expect(tituloCambio(r, 'definicion')).toContain('Nueva etapa')
  })
})

describe('mesetas (tras un parón o al salir de una definición)', () => {
  const mant = { ...base, fase: 'mantenimiento' as const, situacion: 'paron' as const }
  it('con el peso estable, +200 kcal; si no, espera; tras 2 mesetas de un parón, ya puedes definir', () => {
    const estable = revisar({ ...mant, serie: serie(0) })
    expect(estable).toMatchObject({ tipo: 'cambio', a: base.kcal + 200, extra: { meseta: true } })
    expect(revisar({ ...mant, serie: serie(0.5) }).tipo).toBe('meseta')
    expect(revisar({ ...mant, serie: serie(0), mesetas: 2 }).tipo).toBe('mesetasHechas')
    expect(revisar({ ...mant, situacion: 'salida', serie: serie(0), mesetas: 3 }).tipo).toBe('cambio')
  })
})

describe('consejosDeLaSemana', () => {
  it('si la grasa no baja; solo en definición', () => {
    expect(consejosDeLaSemana({ fase: 'definicion', lento: true })[0]).toContain('Si la grasa no baja')
    expect(consejosDeLaSemana({ fase: 'definicion', lento: false })).toEqual([])
    expect(consejosDeLaSemana({ fase: 'volumen', lento: true })).toEqual([])
  })
})

describe('etapa final de la definición', () => {
  it('desde la semana 9, si hay que bajar, −100 en vez de −150', () => {
    const lento = { ...base, serie: serie(-0.28) }
    const antes = revisar(lento)
    const final = revisar({ ...lento, semanaFase: 10 })
    expect(antes.tipo === 'cambio' && antes.de - antes.a).toBe(150)
    expect(final.tipo === 'cambio' && final.de - final.a).toBe(100)
  })
})
