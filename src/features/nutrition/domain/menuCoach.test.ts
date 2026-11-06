import { describe, expect, it } from 'vitest'
import { totalCon } from './fit.ts'
import { conPlato, menuVacio, type Hueco } from './menu.ts'
import { propuestasDelMenu, type Contexto } from './menuCoach.ts'
import type { IngredientePlato, Plato } from './recipes.ts'

const ing = (gramos: number, por100: [number, number, number, number], macro: IngredientePlato['macro']) => ({
  texto: '',
  nombre: 'x',
  categoria: 'Carnes',
  por100: { kcal: por100[0], protein: por100[1], carbs: por100[2], fat: por100[3] },
  alimentoId: 'f_x',
  cuenta: true,
  gramos,
  sugerido: false,
  macro,
})
const plato = (
  id: string,
  categoria: string,
  total: [number, number, number, number],
  ingredientes: IngredientePlato[],
): Plato => ({
  id,
  numero: null,
  nombre: id,
  categoria,
  dificultad: '',
  minutos: null,
  raciones: 1,
  total: { kcal: total[0], protein: total[1], carbs: total[2], fat: total[3] },
  ingredientes,
  pasos: [],
  ajustable: true,
  origen: 'recetario',
})

const pasta = plato('pasta', 'carne', [600, 15, 110, 10], [ing(300, [150, 5, 30, 1], 'carbs')])
const pollo = plato(
  'pollo',
  'carne',
  [550, 55, 50, 12],
  [ing(200, [110, 23, 0, 2], 'protein'), ing(170, [130, 3, 28, 0.3], 'carbs')],
)
const tostada = plato('tostada', 'panes', [400, 15, 50, 15], [ing(70, [250, 9, 49, 1], 'carbs')])
const platos = [pasta, pollo, tostada]
const fecha = '2026-11-12'
const contexto = (objetivo: { kcal: number; protein: number; carbs: number; fat: number }): Contexto => ({
  platos,
  objetivoDe: () => objetivo,
  objetivoDeComida: () => ({ kcal: 450, protein: 30, carbs: 50, fat: 12 }),
  // Los platos tal cual (sin ajustar), para que la prueba sea a mano
  totalDe: (h: Hueco) => {
    const p = platos.find((x) => x.id === h.plato)
    return p
      ? totalCon(
          p,
          p.ingredientes.map((i) => i.gramos),
        )
      : null
  },
})

describe('propuestasDelMenu', () => {
  const menu = [
    ['desayuno', 'tostada'],
    ['comida', 'pasta'],
    ['cena', 'pasta'],
  ].reduce((m, [c, p]) => conPlato(m, 'A', c as Hueco['comida'], p), menuVacio())

  it('si un menú no llega a la proteína, propone cambiar uno de sus platos', () => {
    const [p] = propuestasDelMenu(menu, [fecha], contexto({ kcal: 1800, protein: 120, carbs: 200, fat: 50 }))
    expect(p.tipo).toBe('proteina')
    expect(p.despues[0]).toMatchObject({ menu: 'A', plato: 'pollo' })
    expect(p.detalle).toContain('Te quedas en 45 de 120 g')
  })

  it('«Ahora no» la quita', () => {
    const c = contexto({ kcal: 1800, protein: 120, carbs: 200, fat: 50 })
    const [p] = propuestasDelMenu(menu, [fecha], c)
    expect(propuestasDelMenu({ ...menu, descartadas: [p.id] }, [fecha], c)).toEqual([])
  })

  it('si te faltan kcal y al menú le falta una comida, propone un plato para ella', () => {
    const [p] = propuestasDelMenu(menu, [fecha], contexto({ kcal: 2400, protein: 40, carbs: 300, fat: 60 }))
    expect(p.tipo).toBe('kcal')
    expect(p.despues[0]).toMatchObject({ comida: 'merienda' })
    expect(p.titulo).toContain('te faltan 800 kcal')
  })
})
