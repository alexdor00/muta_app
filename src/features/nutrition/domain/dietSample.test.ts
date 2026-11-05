// La dieta de ejemplo con una base inventada para la prueba (la de verdad, en use-cases/diet.test.ts).
import { describe, expect, it } from 'vitest'
import { leerDieta } from './diet.ts'
import { ALIMENTOS_DEL_EJEMPLO, dietaDeEjemplo } from './dietSample.ts'
import type { Alimento } from './food.ts'

const base: Alimento[] = ALIMENTOS_DEL_EJEMPLO.map((id) => ({
  id,
  name: id,
  category: 'Cereales',
  kcal: 100,
  protein: 10,
  carbs: 10,
  fat: 1,
  servingG: 100,
  servingLabel: '100 g',
}))

describe('la dieta de ejemplo del prototipo', () => {
  it('tres menús de dos días, nueve recetas y dos fases', () => {
    const d = dietaDeEjemplo(base)
    expect(d?.ciclo).toEqual(['A', 'A', 'B', 'B', 'C', 'C', 'A'])
    expect(d?.recetas).toHaveLength(9)
    expect(d?.fases.map((f) => f.desdeSemana)).toEqual([1, 5])
    expect(d?.ejemplo).toBe(true)
    // Lo que cambia en descanso es lo que ajusta
    expect(d?.recetas[0].ingredientes.filter((i) => i.ajusta).map((i) => i.nombre)).toEqual([
      'Arroz (en crudo)',
    ])
  })

  it('es un archivo de dieta válido', () => {
    const d = dietaDeEjemplo(base)
    expect(leerDieta(JSON.parse(JSON.stringify(d)))).toMatchObject({ ok: true })
  })

  it('si falta un alimento en la base, no hay dieta', () => {
    expect(dietaDeEjemplo(base.slice(1))).toBeNull()
  })
})
