import { describe, expect, it } from 'vitest'
import { addDays } from '../../../shared/lib/format.ts'
import type { Alimento, Apunte, ComidaId } from './food.ts'
import { deLoQueSueles, habitosDe, loQueFalta } from './usual.ts'

const hoy = '2026-11-20'
const al = (id: string, kcal: number, protein: number, carbs: number, fat: number): Alimento => ({
  id,
  name: id,
  category: 'Otros',
  kcal,
  protein,
  carbs,
  fat,
  servingG: 100,
  servingLabel: 'ración',
})
const BASE: Record<string, Alimento> = {
  pollo: al('pollo', 110, 23, 0, 1.5),
  arroz: al('arroz', 130, 2.7, 28, 0.3),
  skyr: al('skyr', 60, 11, 4, 0.2),
  aceite: al('aceite', 884, 0, 0, 100),
}
let n = 0
const ap = (alimentoId: string, gramos: number, comida: ComidaId): Apunte => ({
  id: String(n++),
  comida,
  nombre: alimentoId,
  alimentoId,
  gramos,
  raciones: null,
  racion: null,
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
})
/** Días apuntados: pollo en la comida, skyr en la merienda, arroz; el aceite, una sola vez. */
const dias = (cuantos: number): Record<string, Apunte[]> =>
  Object.fromEntries(
    Array.from({ length: cuantos }, (_, i) => [
      addDays(hoy, -(i + 1)),
      [
        ap('pollo', i % 2 ? 150 : 200, 'comida'),
        ap('skyr', 170, 'merienda'),
        ap('arroz', 200, 'comida'),
        ...(i === 0 ? [ap('aceite', 10, 'cena')] : []),
      ],
    ]),
  )

describe('lo que sueles comer', () => {
  it('aprende con 7 días apuntados en 2 semanas: lo que repites y cuánto sueles echar', () => {
    expect(habitosDe(dias(6), hoy)).toBeNull()
    const h = habitosDe(dias(8), hoy)!
    expect(h.map((x) => x.alimentoId).sort()).toEqual(['arroz', 'pollo', 'skyr'])
    expect(h.find((x) => x.alimentoId === 'pollo')).toMatchObject({
      veces: 8,
      gramos: 175,
      enComida: { comida: 8 },
    })
  })

  it('lo que más falta: proteína, hidratos, grasa; nada si quedan menos de 100 kcal', () => {
    expect(loQueFalta({ kcal: 600, protein: 40, carbs: 80, fat: 10 })).toBe('protein')
    expect(loQueFalta({ kcal: 600, protein: 5, carbs: 80, fat: 10 })).toBe('carbs')
    expect(loQueFalta({ kcal: 80, protein: 40, carbs: 80, fat: 10 })).toBeNull()
  })

  it('si falta proteína, propone tu pollo y tu skyr (primero lo de esta comida), sin pasarse de kcal', () => {
    const h = habitosDe(dias(8), hoy)!
    const p = deLoQueSueles(
      h,
      { kcal: 500, protein: 45, carbs: 30, fat: 10 },
      'comida',
      (id) => BASE[id] ?? null,
    )
    expect(p.map((x) => x.alimento.id)).toEqual(['pollo', 'skyr', 'arroz'])
    expect(p[0].gramos).toBe(175)
    // Si quedan pocas kcal, menos gramos (de 5 en 5) o nada
    const poco = deLoQueSueles(
      h,
      { kcal: 120, protein: 30, carbs: 10, fat: 5 },
      'comida',
      (id) => BASE[id] ?? null,
    )
    expect(poco[0]).toMatchObject({ gramos: 105 })
    expect(poco.every((x) => x.aporta.kcal <= 120)).toBe(true)
  })
})
