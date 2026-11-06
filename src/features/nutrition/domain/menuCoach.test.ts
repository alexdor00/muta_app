import { describe, expect, it } from 'vitest'
import { conHueco, menuVacio, type Hueco } from './menu.ts'
import { propuestasDelMenu } from './menuCoach.ts'
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
const h = (comida: Hueco['comida'], p: string): Hueco => ({
  fecha,
  comida,
  plato: p,
  gramos: null,
  cocinado: null,
})
const objetivo = { kcal: 1800, protein: 120, carbs: 200, fat: 50 }

describe('propuestasDelMenu', () => {
  const menu = [h('desayuno', 'tostada'), h('comida', 'pasta'), h('cena', 'pasta')].reduce(
    conHueco,
    menuVacio(),
  )

  it('si un día no llegas a la proteína, propone cambiar un plato por otro que sí', () => {
    const [p] = propuestasDelMenu(menu, [fecha], platos, () => objetivo)
    expect(p.tipo).toBe('proteina')
    expect(p.despues[0].plato).toBe('pollo')
    expect(p.detalle).toContain('te quedas en 45 de 120 g')
  })

  it('«Ahora no» la quita; un día con menos de 3 comidas no se revisa', () => {
    const [p] = propuestasDelMenu(menu, [fecha], platos, () => objetivo)
    expect(propuestasDelMenu({ ...menu, descartadas: [p.id] }, [fecha], platos, () => objetivo)).toEqual([])
    const corto = [h('comida', 'pasta')].reduce(conHueco, menuVacio())
    expect(propuestasDelMenu(corto, [fecha], platos, () => objetivo)).toEqual([])
  })

  it('si con la proteína vas bien pero te pasas de kcal, propone ajustar los gramos del día', () => {
    const lleno = [h('desayuno', 'tostada'), h('comida', 'pollo'), h('cena', 'pollo')].reduce(
      conHueco,
      menuVacio(),
    )
    const [p] = propuestasDelMenu(lleno, [fecha], platos, () => ({
      kcal: 1100,
      protein: 100,
      carbs: 90,
      fat: 30,
    }))
    expect(p.tipo).toBe('kcal')
    expect(p.titulo).toContain('te pasas 400 kcal')
    expect(p.despues.every((x) => x.gramos !== null)).toBe(true)
  })
})
