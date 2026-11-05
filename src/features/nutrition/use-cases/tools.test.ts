// Intercambios, la compra y la cocina, con la base de alimentos de verdad (el dominio no lee contenido).
import { describe, expect, it } from 'vitest'
import foods from '../../../shared/content/foods.json'
import type { Alimento } from '../domain/food.ts'
import { diaDeDieta, type DietaActiva } from '../domain/diet.ts'
import { dietaDeEjemplo } from '../domain/dietSample.ts'
import { arrozDe, factorDe, platoPor100, racionDeOlla } from '../domain/kitchen.ts'
import { listaDeLaCompra, seccionDe, textoDeLaCompra } from '../domain/shopping.ts'
import { intercambios, macroPrincipal } from '../domain/swaps.ts'

const base = foods as Alimento[]
const ejemplo = dietaDeEjemplo(base)
if (!ejemplo) throw new Error('sin dieta de ejemplo')
const activa: DietaActiva = {
  id: 'dieta',
  target: 'nutricion',
  dieta: ejemplo,
  inicio: '2026-11-05',
  ajustes: [],
  tipoElegido: {},
  factorArroz: 3,
  originales: {},
}

describe('intercambios', () => {
  it('100 g de arroz crudo: los mismos 79 g de hidratos en patata o cebada, sin harinas ni cereales', () => {
    const arroz = base.find((a) => a.id === 'f_arroz_blanco_crudo')
    if (!arroz) throw new Error('sin arroz')
    const r = intercambios({ nombre: arroz.name, por100: arroz }, 100, base)
    expect(r.macro).toBe('carbs')
    expect(r.cantidad).toBe(79)
    const de = (n: string) => r.lista.find((x) => x.alimento.name === n)
    expect(de('Patata (cruda)')?.gramos).toBe(465)
    expect(de('Cebada perlada (cruda)')?.gramos).toBe(100)
    expect(r.lista.some((x) => /arroz|harina|cereales|flakes/i.test(x.alimento.name))).toBe(false)
    expect(r.lista.length).toBeLessThanOrEqual(9)
  })

  it('el macro principal es el que más kcal aporta', () => {
    expect(macroPrincipal({ protein: 23, carbs: 0, fat: 1.5 })).toBe('protein')
    expect(macroPrincipal({ protein: 0, carbs: 0, fat: 100 })).toBe('fat')
  })
})

describe('la compra', () => {
  const dias = ['2026-11-05', '2026-11-06'].map((f, i) => diaDeDieta(activa, f, i ? 'descanso' : 'entreno'))

  it('suma los gramos de cada alimento en los días elegidos', () => {
    const lista = listaDeLaCompra(dias)
    // Menú A los dos días: 170 g de pollo cada día
    expect(lista.find((p) => p.clave === 'f_pechuga_de_pollo_cruda')?.gramos).toBe(340)
    // Arroz: 100 g entreno + 60 g descanso
    expect(lista.find((p) => p.clave === 'f_arroz_blanco_crudo')?.gramos).toBe(160)
    expect(lista.find((p) => p.clave === 'f_arroz_blanco_crudo')?.nombre).toBe('Arroz')
  })

  it('las raciones de más de quien coma contigo', () => {
    const lista = listaDeLaCompra(dias, { pollo_arroz: 1 })
    expect(lista.find((p) => p.clave === 'f_pechuga_de_pollo_cruda')?.gramos).toBe(680)
  })

  it('por secciones, como texto, sin lo que ya tienes', () => {
    expect(seccionDe('Pescados')).toBe('carne')
    expect(seccionDe('Rarezas')).toBe('despensa')
    const lista = listaDeLaCompra(dias)
    const texto = textoDeLaCompra(
      lista,
      new Set(['f_salmon_crudo']),
      [{ id: 'x1', nombre: 'Café', seccion: 'despensa' }],
      (g) => `${g} g`,
    )
    expect(texto).toContain('CARNE Y PESCADO\n· Pechuga de pollo: 340 g')
    expect(texto).not.toContain('Salmón')
    expect(texto).toContain('· Café')
  })
})

describe('la cocina', () => {
  it('el arroz de los menús y tu factor', () => {
    const dia = diaDeDieta(activa, '2026-11-05', 'entreno')
    expect(arrozDe(dia.recetas, 3)).toEqual({
      crudo: 100,
      recetas: [{ nombre: 'Pollo con arroz y verduras', crudo: 100, cocido: 300 }],
    })
    expect(factorDe(260, 780)).toBe(3)
    expect(factorDe(0, 780)).toBeNull()
  })

  it('repartir una olla y un plato por 100 g cocinado', () => {
    expect(racionDeOlla(1250, 2890, 3)).toBe(547)
    expect(racionDeOlla(1250, 1000, 3)).toBeNull()
    const plato = platoPor100(
      [
        { por100: { kcal: 110, protein: 23, carbs: 0, fat: 1.5 }, gramos: 500 },
        { por100: { kcal: 355, protein: 7, carbs: 79, fat: 0.6 }, gramos: 200 },
      ],
      1100,
    )
    expect(plato.crudo).toBe(700)
    expect(plato.total.kcal).toBe(1260)
    expect(plato.por100).toEqual({ kcal: 115, protein: 11.7, carbs: 14.4, fat: 0.8 })
  })
})
