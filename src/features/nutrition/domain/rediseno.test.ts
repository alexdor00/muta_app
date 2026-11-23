// Las piezas del rediseño de Nutrición (2026-11-17): parecidos, menú propuesto, filtrar recetas, un plato solo un día y
// cuánto queda en casa.
import { describe, expect, it } from 'vitest'
import { menuPropuesto, parecidos, REPARTOS } from './fit.ts'
import { conCambioDelDia, huecoDe, leerMenu, menuVacio } from './menu.ts'
import { FILTRO_RECETAS, filtrarPlatos, type Plato } from './recipes.ts'

const plato = (id: string, kcal: number, protein: number, extra: Partial<Plato> = {}): Plato => ({
  id,
  numero: null,
  nombre: id,
  categoria: 'ejemplo',
  dificultad: 'Fácil',
  minutos: 20,
  raciones: 1,
  total: { kcal, protein, carbs: 50, fat: 10 },
  ingredientes: [],
  pasos: [],
  ajustable: false,
  origen: 'ejemplo',
  ...extra,
})

describe('parecidos en calorías y proteína', () => {
  it('ordena por la diferencia relativa y deja fuera el mismo plato', () => {
    const actual = plato('a', 600, 40)
    const lista = [actual, plato('lejos', 300, 10), plato('cerca', 580, 38), plato('medio', 500, 30)]
    expect(parecidos(lista, actual, 'comida', 2).map((p) => p.id)).toEqual(['cerca', 'medio'])
  })
})

describe('menú propuesto', () => {
  it('un plato por comida, sin repetir', () => {
    const lista = ['d', 'c', 'm', 'n'].map((x, i) => plato(x, 300 + i * 100, 20 + i * 5))
    const m = menuPropuesto(lista, { kcal: 2000, protein: 150, carbs: 200, fat: 60 })
    const ids = Object.values(m)
    expect(ids.length).toBe(4)
    expect(new Set(ids).size).toBe(4)
  })
})

describe('filtrar recetas', () => {
  const lista = [
    plato('rapida', 400, 20, { minutos: 10 }),
    plato('lenta', 500, 45, { minutos: 60, dificultad: 'Intermedia' }),
    plato('media', 300, 30, { minutos: 25 }),
  ]
  const c = { error: null, guardadas: ['media'] }
  it('de serie, de la A a la Z; o más proteína primero', () => {
    expect(filtrarPlatos(lista, FILTRO_RECETAS, c).map((p) => p.nombre)).toEqual(
      [...lista].map((p) => p.nombre).sort((x, y) => x.localeCompare(y, 'es')),
    )
    expect(filtrarPlatos(lista, { ...FILTRO_RECETAS, orden: 'proteina' }, c).map((p) => p.id)).toEqual([
      'lenta',
      'media',
      'rapida',
    ])
  })
  it('tiempo, dificultad, orden y guardadas', () => {
    expect(filtrarPlatos(lista, { ...FILTRO_RECETAS, tiempo: 30 }, c).map((p) => p.id)).toEqual([
      'media',
      'rapida',
    ])
    expect(filtrarPlatos(lista, { ...FILTRO_RECETAS, dificultad: 'Intermedia' }, c).map((p) => p.id)).toEqual(
      ['lenta'],
    )
    expect(filtrarPlatos(lista, { ...FILTRO_RECETAS, orden: 'kcal' }, c).map((p) => p.id)).toEqual([
      'media',
      'rapida',
      'lenta',
    ])
    expect(filtrarPlatos(lista, { ...FILTRO_RECETAS, guardadas: true }, c).map((p) => p.id)).toEqual([
      'media',
    ])
  })
})

describe('un plato cambiado solo un día', () => {
  it('manda sobre el del menú ese día y se quita con null', () => {
    const base = { ...menuVacio(), menus: [{ id: 'A', nombre: 'Menú A', platos: { cena: 'salmon' } }] }
    const lunes = '2026-11-16'
    const m = conCambioDelDia(base, lunes, 'cena', 'pollo', lunes)
    expect(huecoDe(m, lunes, 'cena')?.plato).toBe('pollo')
    expect(huecoDe(m, '2026-11-17', 'cena')?.plato).toBe('salmon')
    expect(huecoDe(conCambioDelDia(m, lunes, 'cena', null, lunes), lunes, 'cena')?.plato).toBe('salmon')
  })
  it('lo guardado sin cambios se lee con la lista vacía', () => {
    expect(
      leerMenu({ menus: [{ id: 'A', nombre: 'Menú A', platos: {} }], semana: Array(7).fill('A') }).cambiados,
    ).toEqual({})
  })
})

describe('cómo sueles comer', () => {
  it('cada forma reparte el día entero', () => {
    for (const r of Object.values(REPARTOS))
      expect(Object.values(r).reduce((s, x) => s + x, 0)).toBeCloseTo(1)
    expect(REPARTOS.cena.cena).toBeGreaterThan(REPARTOS.repartido.cena)
  })
})
