// La compra con recetas hechas a mano (con la dieta de ejemplo de verdad, en use-cases/tools.test.ts).
import { describe, expect, it } from 'vitest'
import { recetaDelDia, type Receta } from './diet.ts'
import { listaDeLaCompra, seccionDe, textoDeLaCompra } from './shopping.ts'

const receta: Receta = {
  id: 'r',
  nombre: 'Pollo con arroz',
  comida: 'comida',
  rotulo: 'Comida 1',
  menu: 'A',
  soloEntreno: false,
  ingredientes: [
    {
      nombre: 'Pechuga de pollo (cruda)',
      alimentoId: 'pollo',
      categoria: 'Carnes',
      por100: { kcal: 110, protein: 23, carbs: 0, fat: 1.5 },
      gramos: { entreno: 600, descanso: 500 },
      ajusta: false,
      nota: '',
    },
    {
      nombre: 'Sal',
      alimentoId: null,
      categoria: '',
      por100: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      gramos: null,
      ajusta: false,
      nota: 'al gusto',
    },
  ],
  pasos: [],
  notas: [],
  propia: false,
}

const dias = [{ recetas: [recetaDelDia(receta, 'entreno')] }, { recetas: [recetaDelDia(receta, 'descanso')] }]

describe('la lista de la compra', () => {
  it('suma los gramos de todos los días; lo de «al gusto», sin cantidad', () => {
    const lista = listaDeLaCompra(dias)
    expect(lista).toEqual([
      {
        clave: 'pollo',
        nombre: 'Pechuga de pollo',
        seccion: 'carne',
        gramos: 1100,
        usos: ['Pollo con arroz'],
      },
      { clave: 'sal', nombre: 'Sal', seccion: 'despensa', gramos: null, usos: ['Pollo con arroz'] },
    ])
  })

  it('las raciones de más multiplican', () => {
    expect(listaDeLaCompra(dias, { r: 1 })[0].gramos).toBe(2200)
  })

  it('cada categoría en su sección', () => {
    expect(seccionDe('Verduras')).toBe('fruta')
    expect(seccionDe('Grasas')).toBe('aceites')
  })

  it('el texto para compartir, sin lo que ya tienes', () => {
    const texto = textoDeLaCompra(listaDeLaCompra(dias), new Set(['sal']), [], (g) => `${g / 1000} kg`)
    expect(texto).toBe('CARNE Y PESCADO\n· Pechuga de pollo: 1.1 kg')
  })
})
