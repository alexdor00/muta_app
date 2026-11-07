// La compra con recetas hechas a mano (con la dieta de ejemplo de verdad, en use-cases/tools.test.ts).
import { describe, expect, it } from 'vitest'
import { recetaDelDia, type Receta } from './diet.ts'
import { emojiDe, listaDeLaCompra, seccionDe, textoDeLaCompra, type RecetaParaComprar } from './shopping.ts'

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
        menus: [],
      },
      { clave: 'sal', nombre: 'Sal', seccion: 'aceites', gramos: null, usos: ['Pollo con arroz'], menus: [] },
    ])
  })

  it('las raciones de más multiplican', () => {
    expect(listaDeLaCompra(dias, { r: 1 })[0].gramos).toBe(2200)
  })

  it('cada categoría en su sección, y lo que la base guarda junto, por su nombre', () => {
    expect(seccionDe('Verduras', 'Cebolla')).toBe('verdura')
    expect(seccionDe('Frutas', 'Mango')).toBe('fruta')
    expect(seccionDe('Pescados', 'Salmón')).toBe('pescado')
    expect(seccionDe('Grasas', 'Aceite de oliva')).toBe('aceites')
    // El caldo y la salsa, como verdura en la base; los frutos secos, como grasa
    expect(seccionDe('Verduras', 'Caldo de pollo')).toBe('conservas')
    expect(seccionDe('Verduras', 'Salsa de tomate')).toBe('conservas')
    expect(seccionDe('Grasas', 'Almendras')).toBe('frutos')
    expect(seccionDe('', 'Sal')).toBe('aceites')
    // «sal» no es «salmón» ni «salsa»
    expect(seccionDe('Pescados', 'Salmón ahumado')).toBe('pescado')
    expect(seccionDe('Legumbres', 'Lentejas (crudas)')).toBe('legumbres')
    // Lo que no está en la base, por su nombre
    expect(seccionDe('', 'Ajo')).toBe('verdura')
    expect(seccionDe('', 'Zumo de lima al gusto')).toBe('fruta')
    expect(seccionDe('', 'Algo raro')).toBe('despensa')
  })

  it('el texto para compartir, sin lo que ya tienes', () => {
    const texto = textoDeLaCompra(listaDeLaCompra(dias), new Set(['sal']), [], (g) => `${g / 1000} kg`)
    expect(texto).toBe('CARNE\n· Pechuga de pollo: 1.1 kg')
  })
})

describe('la compra: de qué menú sale y su emoticono', () => {
  it('cada producto dice de qué menús sale', () => {
    const r = (id: string, deMenu: string): RecetaParaComprar => ({
      id,
      nombre: id,
      deMenu,
      lista: [{ alimentoId: 'f_arroz', nombre: 'Arroz', categoria: 'Cereales', g: 100 }],
    })
    expect(
      listaDeLaCompra([{ recetas: [r('a', 'Menú B'), r('b', 'Menú A'), r('c', 'Menú B')] }])[0].menus,
    ).toEqual(['Menú A', 'Menú B'])
  })
  it('por su nombre y, si no, por su sección; «sal» no es «salmón»', () => {
    expect(emojiDe('Aguacate', 'fruta')).toBe('🥑')
    expect(emojiDe('Salmón ahumado', 'pescado')).toBe('🐟')
    expect(emojiDe('Sal al gusto', 'aceites')).toBe('🧂')
    expect(emojiDe('Pechuga de pollo', 'carne')).toBe('🍗')
    expect(emojiDe('Algo raro', 'legumbres')).toBe('🫘')
  })
})
