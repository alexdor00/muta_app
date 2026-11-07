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
  cambioEn,
  claveDelDia,
  platoCon,
  platoEditado,
  productosVacios,
  vaCon,
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

describe('tus cambios', () => {
  const p = platoTuyo('mio-1', 'Arroz con pollo', [ingredienteDe(arroz, 150), ingredienteDe(pollo, 100)])
  const patata = {
    id: 'f_patata',
    name: 'Patata',
    category: 'Tubérculos',
    kcal: 80,
    protein: 2,
    carbs: 17,
    fat: 0.1,
  }
  const alimentoDe = (id: string) =>
    id === 'f_patata' ? patata : id === 'mio_arroz' ? { ...arroz, id, kcal: 150 } : null

  it('tu marca en todos tus platos, con los mismos gramos', () => {
    const c = { ...productosVacios(), siempre: { f_arroz: 'mio_arroz' } }
    const con = platoCon(p, c, alimentoDe, '2026-11-09')
    expect(con.ingredientes[0]).toMatchObject({ alimentoId: 'mio_arroz', gramos: 150, antes: 'Arroz cocido' })
    expect(con.total.kcal).toBeCloseTo(p.total.kcal + 30)
  })

  it('otro alimento en un plato: sus gramos; «solo hoy» vale ese día', () => {
    const c = {
      ...productosVacios(),
      enPlato: { 'mio-1': { '0': { alimentoId: 'f_patata', gramos: 250, fecha: '2026-11-09' } } },
    }
    expect(platoCon(p, c, alimentoDe, '2026-11-09').ingredientes[0]).toMatchObject({
      nombre: 'Patata',
      gramos: 250,
    })
    expect(platoCon(p, c, alimentoDe, '2026-11-10')).toBe(p)
    expect(cambioEn(null, p, 0, '2026-11-09')).toBeNull()
  })

  it('el cambio de un día convive con el de siempre: ese día manda el suyo, los demás el de siempre', () => {
    const c = {
      ...productosVacios(),
      enPlato: {
        'mio-1': {
          '0': { alimentoId: 'mio_arroz', gramos: null },
          [claveDelDia(0, '2026-11-09')]: { alimentoId: 'f_patata', gramos: 250, fecha: '2026-11-09' },
        },
      },
    }
    expect(cambioEn(c, p, 0, '2026-11-09')?.alimentoId).toBe('f_patata')
    expect(cambioEn(c, p, 0, '2026-11-10')?.alimentoId).toBe('mio_arroz')
  })
})

describe('tu versión de un plato', () => {
  it('cambia gramos, quita y añade, y el total parte del suyo', () => {
    const p = {
      ...platoTuyo('rec-1', 'Arroz con pollo', [ingredienteDe(arroz, 100), ingredienteDe(pollo, 100)]),
      origen: 'recetario' as const,
      total: { kcal: 300, protein: 30, carbs: 30, fat: 3 },
    }
    const v = platoEditado(p, {
      id: 'mio-1',
      nombre: 'Mi arroz',
      gramos: [200, null],
      quitar: [1],
      anadir: [ingredienteDe(pollo, 50)],
      pasos: ['Cocer'],
    })
    expect(v.ingredientes.map((i) => i.gramos)).toEqual([200, 50])
    expect(v.total.kcal).toBe(300 + 130 - 110 + 55)
    expect(v).toMatchObject({ id: 'mio-1', nombre: 'Mi arroz', origen: 'tuyo', categoria: 'tuyos' })
  })
})
