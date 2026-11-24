import { describe, expect, it } from 'vitest'
import {
  antesYAhora,
  cambioEnTramo,
  claveDe,
  estrellaDe,
  mesesCumplidos,
  mesesDespues,
  objetivoCumplido,
  pendientes,
  perimetrosQueCrecen,
} from './logro.ts'

describe('cuándo toca tu logro y tu premio', () => {
  it('los meses: en múltiplos de 6, con el último día del mes si no existe el día', () => {
    expect(mesesDespues('2026-01-31', 1)).toBe('2026-02-28')
    expect(mesesDespues('2026-08-15', 6)).toBe('2027-02-15')
    expect(mesesCumplidos('2026-01-10', '2026-07-09')).toBe(0)
    expect(mesesCumplidos('2026-01-10', '2026-07-10')).toBe(6)
    expect(mesesCumplidos('2025-01-10', '2026-07-10')).toBe(18)
  })

  const etapas = [
    { id: 'vieja', inicio: '2025-01-01', fin: '2025-06-30' },
    { id: 'cerrada', inicio: '2025-07-01', fin: '2026-11-20' },
    { id: 'ahora', inicio: '2026-05-01', fin: null },
  ]

  it('las etapas que acabaron y los 6 meses de la que llevas, desde que llegó esta función', () => {
    const p = pendientes({ etapas, desde: '2026-11-01', hoy: '2026-11-24', vistos: new Set(), premio: null })
    expect(p).toEqual([
      { tipo: 'etapa', etapaId: 'cerrada' },
      { tipo: 'meses', etapaId: 'ahora', meses: 6 },
    ])
  })

  it('lo que ya viste no vuelve; el premio va el primero', () => {
    const vistos = new Set([claveDe({ tipo: 'etapa', etapaId: 'cerrada' })])
    const p = pendientes({
      etapas,
      desde: '2026-11-01',
      hoy: '2026-11-24',
      vistos,
      premio: { etapaId: 'ahora', fase: 'definicion' },
    })
    expect(p.map(claveDe)).toEqual(['premio:ahora:definicion', 'meses:ahora:6'])
  })

  it('lo de antes de que llegara la función no se celebra de golpe', () => {
    const p = pendientes({ etapas, desde: '2026-11-22', hoy: '2026-11-24', vistos: new Set(), premio: null })
    expect(p).toEqual([])
  })

  it('el objetivo: grasa en definición, peso en volumen; en mantenimiento, ninguno', () => {
    const obj = { grasa: 12, peso: 82 }
    expect(objetivoCumplido('definicion', { grasa: 11.8, peso: 75 }, obj)).toBe('definicion')
    expect(objetivoCumplido('definicion', { grasa: 12.4, peso: 75 }, obj)).toBeNull()
    expect(objetivoCumplido('definicion', { grasa: null, peso: 75 }, obj)).toBeNull()
    expect(objetivoCumplido('volumen', { grasa: 15, peso: 82.1 }, obj)).toBe('volumen')
    expect(objetivoCumplido('volumen', { grasa: 15, peso: 80 }, obj)).toBeNull()
    expect(objetivoCumplido('volumen', { grasa: 15, peso: 90 }, { grasa: 12, peso: null })).toBeNull()
    expect(objetivoCumplido('mantenimiento', { grasa: 10, peso: 90 }, obj)).toBeNull()
  })
})

describe('las cifras', () => {
  const p = (fecha: string, kg: number) => ({ fecha, e1rm: kg * 1.27, serie: { kg, reps: 8 } })

  it('tu ejercicio estrella: el que más subió, hecho 3 veces o más en el tramo', () => {
    const e = estrellaDe(
      [
        { nombre: 'Press banca', puntos: [p('2026-09-01', 80), p('2026-10-01', 90), p('2026-11-01', 100)] },
        { nombre: 'Sentadilla', puntos: [p('2026-09-01', 100), p('2026-10-01', 105), p('2026-11-01', 110)] },
        // Sube mucho, pero solo 2 veces: no cuenta
        { nombre: 'Curl', puntos: [p('2026-09-01', 10), p('2026-11-01', 20)] },
      ],
      '2026-09-01',
      '2026-11-30',
    )
    expect(e).toMatchObject({ nombre: 'Press banca', de: { kg: 80 }, a: { kg: 100 } })
    expect(e?.cambio).toBeCloseTo(0.25, 5)
  })

  it('sin ninguno que suba, no hay estrella', () => {
    expect(
      estrellaDe(
        [{ nombre: 'Press', puntos: [p('2026-09-01', 80), p('2026-10-01', 80), p('2026-11-01', 78)] }],
        '2026-09-01',
        '2026-11-30',
      ),
    ).toBeNull()
  })

  it('lo que cambió en el tramo: del último de antes de empezar (tu cuerpo al empezar) al último', () => {
    const peso = [
      { date: '2026-08-30', v: 90 },
      { date: '2026-09-02', v: 82.3 },
      { date: '2026-10-15', v: 79 },
      { date: '2026-11-20', v: 75.1 },
    ]
    expect(cambioEnTramo(peso, '2026-09-01', '2026-11-30')).toEqual({ de: 90, a: 75.1, cambio: -14.9 })
    // Sin nada de antes, el primero dentro
    expect(cambioEnTramo(peso.slice(1), '2026-09-01', '2026-11-30')).toEqual({
      de: 82.3,
      a: 75.1,
      cambio: -7.2,
    })
    expect(cambioEnTramo(peso.slice(0, 1), '2026-09-01', '2026-11-30')).toBeNull()
  })

  it('los perímetros que más crecen (sin cintura, cadera ni cuello)', () => {
    const medidas = [
      { date: '2026-03-01', brazo: 36, pecho: 100, muslo: 58, cintura: 80 },
      { date: '2026-11-01', brazo: 38.5, pecho: 104, muslo: 59, cintura: 84 },
    ]
    expect(perimetrosQueCrecen(medidas, '2026-03-01', '2026-11-30')).toEqual([
      { id: 'pecho', nombre: 'Pecho', cm: 4 },
      { id: 'brazo', nombre: 'Brazo', cm: 2.5 },
    ])
  })
})

describe('tu antes y después', () => {
  it('la última foto de antes de empezar y la última de la etapa', () => {
    const f = [{ date: '2026-08-01' }, { date: '2026-09-28' }, { date: '2026-10-28' }, { date: '2026-11-20' }]
    expect(antesYAhora(f, '2026-10-01', '2026-11-24')).toEqual([
      { date: '2026-09-28' },
      { date: '2026-11-20' },
    ])
    expect(antesYAhora([{ date: '2026-11-20' }], '2026-10-01', '2026-11-24')).toBeNull()
  })
})
