import { describe, expect, it } from 'vitest'
import foods from '../../../shared/content/foods.json'
import { POPULARES, type Alimento } from '../domain/food.ts'
import { apunteDe, apunteRapido, textoCantidad, textoRacion } from './foodLog.ts'

const lista = foods as Alimento[]

// Lo que se aparta de kcal ≈ 4P + 4H + 9G por una razón: fibra (verdura, fruta, salvado), alcohol (bebidas),
// polioles (eritritol), ácido acético (vinagre) o un dato de etiqueta (batido, espirulina).
const CON_FIBRA_O_ALCOHOL = ['Verduras', 'Frutas', 'Bebidas']
const EXCEPCIONES = [
  'Salvado de avena',
  'Salvado de trigo',
  'Vinagre',
  'Vinagre balsámico',
  'Eritritol',
  'Spirulina',
  'Batido listo proteico (330 ml)',
]

describe('base de alimentos (shared/content/foods.json)', () => {
  it('1.493 alimentos en 16 categorías, con id único', () => {
    expect(lista).toHaveLength(1493)
    expect(new Set(lista.map((a) => a.category)).size).toBe(16)
    expect(new Set(lista.map((a) => a.id)).size).toBe(lista.length)
  })

  it('cada uno con valores por 100 g y una ración', () => {
    for (const a of lista) {
      expect(a.name.length, a.id).toBeGreaterThan(0)
      for (const n of [a.kcal, a.protein, a.carbs, a.fat]) expect(n, a.id).toBeGreaterThanOrEqual(0)
      expect(a.servingG, a.id).toBeGreaterThan(0)
      expect(a.servingLabel.length, a.id).toBeGreaterThan(0)
    }
  })

  it('kcal ≈ 4P + 4H + 9G (±15 %), salvo lo que tiene su razón', () => {
    const raros = lista.filter((a) => {
      const calculadas = 4 * a.protein + 4 * a.carbs + 9 * a.fat
      return (
        a.kcal > 0 &&
        Math.abs(calculadas - a.kcal) > 10 &&
        Math.abs(calculadas - a.kcal) / a.kcal > 0.15 &&
        !CON_FIBRA_O_ALCOHOL.includes(a.category) &&
        !EXCEPCIONES.includes(a.name)
      )
    })
    expect(raros.map((a) => a.name)).toEqual([])
  })

  it('los habituales existen en la base', () => {
    const ids = new Set(lista.map((a) => a.id))
    expect(POPULARES.filter((id) => !ids.has(id))).toEqual([])
  })
})

describe('apuntes', () => {
  const salmon: Alimento = {
    id: 'f_salmon',
    name: 'Salmón a la plancha',
    category: 'Pescados',
    kcal: 206,
    protein: 22,
    carbs: 0,
    fat: 13,
    servingG: 150,
    servingLabel: 'filete',
  }
  it('en raciones guarda la ración y los gramos', () => {
    expect(apunteDe(salmon, 1.5, 'racion', 'cena')).toEqual({
      comida: 'cena',
      nombre: 'Salmón a la plancha',
      alimentoId: 'f_salmon',
      gramos: 225,
      raciones: 1.5,
      racion: 'filete',
      kcal: 464,
      protein: 49.5,
      carbs: 0,
      fat: 29.3,
    })
    expect(apunteDe(salmon, 80, 'gramos', 'cena').raciones).toBeNull()
  })
  it('el rápido sin nombre se llama «Añadido rápido»', () => {
    expect(apunteRapido(' ', { kcal: 600, protein: 35, carbs: 0, fat: 0 }, 'comida').nombre).toBe(
      'Añadido rápido',
    )
  })
})

describe('la ración en palabras', () => {
  const base = { id: 'x', name: 'X', category: 'Platos', kcal: 100, protein: 1, carbs: 1, fat: 1 }
  it('una ración con nombre lleva sus gramos', () => {
    expect(textoRacion({ ...base, servingG: 150, servingLabel: 'filete' })).toBe('1 filete (150 g)')
    expect(textoCantidad({ raciones: 1.5, racion: 'filete', gramos: 225 })).toBe('1,5 filete · 225 g')
  })
  it('si la ración ya son gramos (los productos de supermercado), solo los gramos', () => {
    expect(textoRacion({ ...base, servingG: 100, servingLabel: '100 g' })).toBe('100 g')
    expect(textoCantidad({ raciones: 1, racion: '100 g', gramos: 100 })).toBe('100 g')
  })
})
