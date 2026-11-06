import { describe, expect, it } from 'vitest'
import type { Receta } from './diet.ts'
import type { Alimento } from './food.ts'
import {
  buscarPlatos,
  ingredienteDe,
  leerRecetario,
  macroDe,
  platoDeReceta,
  platoTuyo,
  productoEn,
  productosVacios,
  vaCon,
  valoresCon,
} from './recipes.ts'

const arroz: Alimento = {
  id: 'f_arroz',
  name: 'Arroz cocido',
  category: 'Cereales',
  kcal: 130,
  protein: 2.7,
  carbs: 28,
  fat: 0.3,
  servingG: 200,
  servingLabel: 'plato',
}
const pollo: Alimento = {
  ...arroz,
  id: 'f_pollo',
  name: 'Pollo',
  category: 'Carnes',
  kcal: 110,
  protein: 23,
  carbs: 0,
  fat: 2,
}

describe('leerRecetario', () => {
  it('lee los platos con la forma esperada y deja fuera los que no', () => {
    const r = leerRecetario({
      rev: 2,
      categorias: [{ id: 'carne', nombre: 'Carne' }],
      recetas: [
        {
          id: 'rec-1',
          numero: 1,
          nombre: 'Tacos',
          categoria: 'carne',
          total: { kcal: 500, protein: 30, carbs: 50, fat: 20 },
          ingredientes: [],
          pasos: ['Uno'],
          ajustable: true,
        },
        { id: 'rec-2', nombre: 'Sin total', ingredientes: [], pasos: [] },
      ],
    })
    expect(r?.rev).toBe(2)
    expect(r?.platos.map((p) => p.id)).toEqual(['rec-1'])
    expect(r?.platos[0].origen).toBe('recetario')
    expect(leerRecetario(null)).toBeNull()
  })
})

describe('macroDe', () => {
  it('la proteína manda si da un 30 % de las kcal; lo que aporta poco no se mueve', () => {
    expect(macroDe({ kcal: 200, protein: 20, carbs: 0, fat: 13 }, 150)).toBe('protein')
    expect(macroDe(arroz, 150)).toBe('carbs')
    expect(macroDe({ kcal: 884, protein: 0, carbs: 0, fat: 100 }, 10)).toBe('fat')
    expect(macroDe({ kcal: 18, protein: 1, carbs: 4, fat: 0 }, 120)).toBeNull()
  })
})

describe('platos tuyos y de ejemplo', () => {
  it('un plato tuyo suma sus ingredientes y se puede ajustar', () => {
    const p = platoTuyo('mio-1', 'Pollo con arroz', [ingredienteDe(arroz, 200), ingredienteDe(pollo, 150)])
    expect(p.total).toEqual({ kcal: 425, protein: 39.9, carbs: 56, fat: 3.6 })
    expect(p.ajustable).toBe(true)
    expect(vaCon(p, 'desayuno')).toBe(true)
  })

  it('una receta de la dieta de ejemplo pasa a plato con los gramos de entreno', () => {
    const receta: Receta = {
      id: 'pollo_arroz',
      nombre: 'Pollo con arroz',
      comida: 'comida',
      rotulo: 'Comida 1',
      menu: 'A',
      soloEntreno: false,
      ingredientes: [
        {
          nombre: 'Arroz',
          alimentoId: 'f_arroz',
          categoria: 'Cereales',
          por100: arroz,
          gramos: { entreno: 200, descanso: 150 },
          ajusta: true,
          nota: '',
        },
        {
          nombre: 'Sal',
          alimentoId: null,
          categoria: 'Grasas',
          por100: arroz,
          gramos: null,
          ajusta: false,
          nota: 'al gusto',
        },
      ],
      pasos: ['Cocer'],
      notas: [],
      propia: false,
    }
    const p = platoDeReceta(receta)
    expect(p.id).toBe('ej-pollo_arroz')
    expect(p.origen).toBe('ejemplo')
    expect(p.total.kcal).toBe(260)
    expect(p.ingredientes[1].cuenta).toBe(false)
  })
})

describe('buscarPlatos y comidas', () => {
  it('busca por el nombre o por un ingrediente, sin tildes', () => {
    const p = platoTuyo('mio-1', 'Bowl de salmón', [ingredienteDe(arroz, 100)])
    expect(buscarPlatos([p], 'salmon')).toHaveLength(1)
    expect(buscarPlatos([p], 'arroz')).toHaveLength(1)
    expect(buscarPlatos([p], 'pasta')).toHaveLength(0)
  })

  it('un postre del recetario va con el desayuno o la merienda, no con la cena', () => {
    const p = { ...platoTuyo('rec-9', 'Bizcocho', []), categoria: 'postres', origen: 'recetario' as const }
    expect(vaCon(p, 'merienda')).toBe(true)
    expect(vaCon(p, 'cena')).toBe(false)
  })
})

describe('tus productos', () => {
  const p = platoTuyo('mio-1', 'Hummus', [ingredienteDe(arroz, 90), ingredienteDe(pollo, 100)])
  const tuyo = { kcal: 312, protein: 7, carbs: 12, fat: 26 }
  const valoresDe = (id: string) => (id === 'mio_hummus' ? tuyo : null)

  it('el tuyo vale en todos los platos o solo en uno (y el de un plato manda)', () => {
    const siempre = { ...productosVacios(), siempre: { f_arroz: 'mio_hummus' } }
    expect(productoEn(siempre, p, 0)).toBe('mio_hummus')
    expect(productoEn(siempre, p, 1)).toBeNull()
    expect(valoresCon(siempre, p, valoresDe)).toEqual([tuyo, null])
    const soloAqui = { ...siempre, enPlato: { 'mio-1': { '1': 'otro' } } }
    expect(productoEn(soloAqui, p, 1)).toBe('otro')
    expect(productoEn(null, p, 0)).toBeNull()
  })
})
