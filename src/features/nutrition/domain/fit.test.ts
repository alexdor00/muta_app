import { describe, expect, it } from 'vitest'
import { ajustar, cuadrarDia, desvio, llegaHasta, mejoresPara, repartir, totalCon } from './fit.ts'
import type { IngredientePlato, Plato } from './recipes.ts'

const ing = (
  nombre: string,
  gramos: number,
  por100: [number, number, number, number],
  macro: IngredientePlato['macro'],
): IngredientePlato => ({
  texto: `${gramos} g de ${nombre}`,
  nombre,
  categoria: 'Cereales',
  por100: { kcal: por100[0], protein: por100[1], carbs: por100[2], fat: por100[3] },
  alimentoId: `f_${nombre}`,
  cuenta: true,
  gramos,
  sugerido: false,
  macro,
})

// Un bowl como el del libro: arroz, salmón, aguacate y algo de verdura que no se mueve
const bowl: Plato = {
  id: 'rec-1',
  numero: 1,
  nombre: 'Bowl',
  categoria: 'pescado',
  dificultad: 'Fácil',
  minutos: 20,
  raciones: 1,
  total: { kcal: 676, protein: 38, carbs: 70, fat: 34 },
  ingredientes: [
    ing('arroz', 150, [135, 3, 29, 0.4], 'carbs'),
    ing('salmon', 150, [200, 20, 0, 13], 'protein'),
    ing('aguacate', 60, [160, 2, 9, 15], 'fat'),
    { ...ing('tomate', 120, [18, 1, 4, 0], null) },
    { ...ing('sal', 0, [0, 0, 0, 0], null), cuenta: false, gramos: null, por100: null, alimentoId: null },
  ],
  pasos: [],
  ajustable: true,
  origen: 'recetario',
}

describe('totalCon', () => {
  it('con los gramos del libro da el total del libro', () => {
    expect(
      totalCon(
        bowl,
        bowl.ingredientes.map((i) => i.gramos),
      ),
    ).toEqual(bowl.total)
  })

  it('suma solo la diferencia de lo que cambia', () => {
    const t = totalCon(bowl, [250, 150, 60, 120, null])
    expect(t.kcal).toBe(676 + 135)
    expect(t.carbs).toBe(99)
  })

  it('con tu producto cuenta sus valores en vez de los del genérico', () => {
    const t = totalCon(
      bowl,
      bowl.ingredientes.map((i) => i.gramos),
      [null, null, { kcal: 260, protein: 2, carbs: 9, fat: 25 }],
    )
    expect(t.kcal).toBe(676 + 60)
    expect(t.fat).toBe(40)
  })
})

describe('ajustar', () => {
  it('se acerca a lo que falta moviendo de 5 en 5 g y deja quieto lo que no aporta', () => {
    const a = ajustar(bowl, { kcal: 880, protein: 50, carbs: 100, fat: 30 })
    expect(a.gramos[3]).toBe(120)
    expect(a.gramos[4]).toBeNull()
    for (const g of a.gramos.slice(0, 3)) expect((g ?? 0) % 5).toBe(0)
    expect(a.corto).toEqual([])
    expect(Math.abs(a.total.carbs - 100)).toBeLessThanOrEqual(8)
    expect(Math.abs(a.total.protein - 50)).toBeLessThanOrEqual(8)
  })

  it('no pasa de los límites: si no llega, dice qué se queda corto', () => {
    const a = ajustar(bowl, { kcal: 1320, protein: 30, carbs: 300, fat: 0 })
    expect(a.gramos[0]).toBe(375)
    expect(a.corto).toContain('carbs')
    expect(llegaHasta(bowl, 'carbs')).toBe(Math.round(70 + (225 * 29) / 100))
  })

  it('un plato sin nada que mover se queda como está', () => {
    const quieto = { ...bowl, ajustable: false }
    expect(ajustar(quieto, { kcal: 300, protein: 20, carbs: 30, fat: 10 }).total).toEqual(bowl.total)
  })
})

describe('desvio', () => {
  it('cuenta corto o de más lo que se aleja más de 8 g o de un 10 %', () => {
    expect(
      desvio({ kcal: 0, protein: 40, carbs: 100, fat: 45 }, { kcal: 0, protein: 50, carbs: 95, fat: 30 }),
    ).toEqual({ corto: ['protein'], sobra: ['fat'] })
  })
})

describe('repartir y cuadrar el día', () => {
  it('reparte lo que falta entre las comidas que quedan según su peso', () => {
    const r = repartir({ kcal: 800, protein: 40, carbs: 80, fat: 40 }, ['merienda', 'cena'])
    expect(r.merienda.kcal).toBe(300)
    expect(r.cena.kcal).toBe(500)
  })

  it('elige un plato por comida sin repetir y respeta el que fijas', () => {
    const otro = { ...bowl, id: 'rec-2', nombre: 'Otro' }
    const postre = { ...bowl, id: 'rec-3', categoria: 'postres' }
    const dia = cuadrarDia([bowl, otro, postre], { kcal: 1400, protein: 80, carbs: 150, fat: 50 }, [
      'comida',
      'cena',
    ])
    expect(dia.map((d) => d.encaje.plato.id).sort()).toEqual(['rec-1', 'rec-2'])
    const fijo = cuadrarDia([bowl, otro], { kcal: 700, protein: 40, carbs: 70, fat: 30 }, ['cena'], {
      cena: 'rec-2',
    })
    expect(fijo[0].encaje.plato.id).toBe('rec-2')
    expect(mejoresPara([postre], 'cena', bowl.total)).toEqual([])
  })
})
