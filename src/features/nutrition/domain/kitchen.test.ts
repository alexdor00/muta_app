// La cocina con recetas hechas a mano (con la dieta de ejemplo de verdad, en use-cases/tools.test.ts).
import { describe, expect, it } from 'vitest'
import { recetaDelDia, type Receta } from './diet.ts'
import type { Alimento } from './food.ts'
import { arrozDe, factorDe, gramosEnCrudo, parejaEnCrudo, platoPor100, racionDeOlla } from './kitchen.ts'

const receta = (nombre: string, ingredientes: [string, number][]): Receta => ({
  id: nombre,
  nombre,
  comida: 'comida',
  rotulo: 'Comida 1',
  menu: 'A',
  soloEntreno: false,
  ingredientes: ingredientes.map(([n, g]) => ({
    nombre: n,
    alimentoId: n,
    categoria: 'Cereales',
    por100: { kcal: 350, protein: 7, carbs: 78, fat: 1 },
    gramos: { entreno: g, descanso: g },
    ajusta: false,
    nota: '',
  })),
  pasos: [],
  notas: [],
  propia: false,
})

describe('el arroz', () => {
  it('suma el arroz de las recetas (no las tortitas ni la harina) con tu factor', () => {
    const recetas = [
      recetaDelDia(receta('Pollo con arroz', [['Arroz (en crudo)', 100]]), 'entreno'),
      recetaDelDia(receta('Merienda', [['Tortitas de arroz', 27]]), 'entreno'),
      recetaDelDia(receta('Lentejas', [['Arroz blanco', 60]]), 'entreno'),
    ]
    expect(arrozDe(recetas, 2.5)).toEqual({
      crudo: 160,
      recetas: [
        { nombre: 'Pollo con arroz', crudo: 100, cocido: 250 },
        { nombre: 'Lentejas', crudo: 60, cocido: 150 },
      ],
    })
  })

  it('tu factor: lo cocido entre lo crudo', () => {
    expect(factorDe(200, 610)).toBe(3.05)
    expect(factorDe(200, 0)).toBeNull()
  })
})

describe('la olla y el plato', () => {
  it('cada ración de una olla', () => {
    expect(racionDeOlla(1000, 2500, 4)).toBe(375)
    expect(racionDeOlla(1000, 2500, 0)).toBeNull()
  })

  it('un plato por 100 g cocinado; sin peso cocinado, solo el total', () => {
    const ingredientes = [{ por100: { kcal: 100, protein: 10, carbs: 10, fat: 2 }, gramos: 500 }]
    expect(platoPor100(ingredientes, 1000).por100).toEqual({ kcal: 50, protein: 5, carbs: 5, fat: 1 })
    expect(platoPor100(ingredientes, 0)).toEqual({
      crudo: 500,
      total: { kcal: 500, protein: 50, carbs: 50, fat: 10 },
      por100: null,
    })
  })
})

describe('cocido y su equivalencia en crudo', () => {
  const al = (id: string, name: string, category: string, kcal: number): Alimento => ({
    id,
    name,
    category,
    kcal,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingG: 100,
    servingLabel: 'ración',
  })
  const cocido = al('a', 'Arroz blanco (cocido)', 'Cereales', 130)
  const crudo = al('b', 'Arroz blanco (crudo)', 'Cereales', 355)
  const base = [cocido, crudo, al('c', 'Arroz integral (crudo)', 'Cereales', 350)]

  it('encuentra su pareja en crudo y calcula los gramos por sus kcal, de 5 en 5', () => {
    expect(parejaEnCrudo(cocido, base)?.id).toBe('b')
    expect(gramosEnCrudo(250, cocido, crudo)).toBe(90)
  })

  it('solo de cereales y legumbres, y solo si lo crudo tiene más kcal', () => {
    const pollo = al('p', 'Pechuga de pollo cocida', 'Carnes', 150)
    expect(parejaEnCrudo(pollo, [pollo, al('q', 'Pechuga de pollo (cruda)', 'Carnes', 110)])).toBeNull()
    expect(parejaEnCrudo(crudo, base)).toBeNull()
    expect(parejaEnCrudo(al('x', 'Arroz basmati cocido', 'Cereales', 130), base)).toBeNull()
  })
})
