// Intercambios con una base hecha a mano (con la base de verdad, en use-cases/tools.test.ts).
import { describe, expect, it } from 'vitest'
import type { Alimento } from './food.ts'
import { intercambios, macroPrincipal } from './swaps.ts'

const a = (
  name: string,
  category: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
): Alimento => ({
  id: name,
  name,
  category,
  kcal,
  protein,
  carbs,
  fat,
  servingG: 100,
  servingLabel: '100 g',
})

const base = [
  a('Arroz integral (crudo)', 'Cereales', 350, 7, 72, 2),
  a('Patata (cruda)', 'Tubérculos', 77, 2, 17, 0.1),
  a('Pasta (cruda)', 'Cereales', 355, 12.5, 72, 1.5),
  a('Patata al horno', 'Tubérculos', 95, 2.5, 21, 0.1),
  a('Harina de trigo', 'Cereales', 340, 10, 72, 1),
  a('Pechuga de pollo (cruda)', 'Carnes', 110, 23, 0, 1.5),
]

describe('intercambios', () => {
  it('los mismos gramos del macro principal, de 5 en 5, sin el mismo alimento, cocinados ni harinas', () => {
    const r = intercambios(
      { nombre: 'Arroz blanco (crudo)', por100: { kcal: 355, protein: 7, carbs: 79, fat: 0.6 } },
      100,
      base,
    )
    expect(r.macro).toBe('carbs')
    expect(r.lista.map((x) => [x.alimento.name, x.gramos])).toEqual([
      ['Patata (cruda)', 465],
      ['Pasta (cruda)', 110],
    ])
    expect(r.lista[0].diferencia).toBe(3)
  })

  it('el macro que más kcal aporta', () => {
    expect(macroPrincipal({ protein: 20, carbs: 5, fat: 5 })).toBe('protein')
    expect(macroPrincipal({ protein: 1, carbs: 1, fat: 1 })).toBe('fat')
  })
})
