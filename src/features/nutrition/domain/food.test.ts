import { describe, expect, it } from 'vitest'
import {
  buscarAlimentos,
  cantidadAlCambiar,
  comidaPorHora,
  gramosDe,
  macrosDe,
  macrosIncompletos,
  modoInicial,
  pasoDe,
  porComida,
  recientes,
  sumar,
  type Alimento,
  type Apunte,
} from './food.ts'

const alimento = (name: string, extra: Partial<Alimento> = {}): Alimento => ({
  id: `f_${name}`,
  name,
  category: 'Carnes',
  kcal: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  servingG: 130,
  servingLabel: 'filete',
  ...extra,
})

const apunte = (extra: Partial<Apunte>): Apunte => ({
  id: 'a',
  comida: 'comida',
  nombre: 'Pollo',
  alimentoId: 'f_pollo',
  gramos: 100,
  raciones: null,
  racion: null,
  kcal: 100,
  protein: 10,
  carbs: 5,
  fat: 2,
  ...extra,
})

describe('macrosDe y sumar', () => {
  it('calcula por 100 g y suma con un decimal', () => {
    expect(macrosDe(alimento('Salmón', { kcal: 206, protein: 22, fat: 13 }), 225)).toEqual({
      kcal: 464,
      protein: 49.5,
      carbs: 0,
      fat: 29.3,
    })
    expect(sumar([apunte({}), apunte({ kcal: 50.4, protein: 0.15 })])).toEqual({
      kcal: 150,
      protein: 10.2,
      carbs: 10,
      fat: 4,
    })
  })
})

describe('comidaPorHora', () => {
  it('desayuno antes de las 11, comida hasta las 16, merienda hasta las 19 y luego cena', () => {
    expect(comidaPorHora(8)).toBe('desayuno')
    expect(comidaPorHora(11)).toBe('comida')
    expect(comidaPorHora(17)).toBe('merienda')
    expect(comidaPorHora(21)).toBe('cena')
  })
})

describe('cantidades', () => {
  it('raciones o gramos, con su paso y al cambiar de modo', () => {
    const pollo = alimento('Pollo', { servingG: 150 })
    expect(gramosDe(pollo, 1.5, 'racion')).toBe(225)
    expect(gramosDe(pollo, 80, 'gramos')).toBe(80)
    expect(pasoDe('racion')).toBe(0.5)
    expect(pasoDe('gramos')).toBe(10)
    expect(cantidadAlCambiar(pollo, 1.5, 'gramos')).toBe(225)
    expect(cantidadAlCambiar(pollo, 200, 'racion')).toBe(1.25)
    expect(cantidadAlCambiar(pollo, 10, 'racion')).toBe(0.25)
  })

  it('lo que se pesa empieza en gramos; lo que va por piezas, en raciones', () => {
    expect(modoInicial(alimento('Arroz', { servingG: 100, servingLabel: 'ración' }))).toBe('gramos')
    expect(modoInicial(alimento('Avena', { servingG: 40, servingLabel: '40 g' }))).toBe('gramos')
    expect(modoInicial(alimento('Huevo', { servingG: 60, servingLabel: 'unidad' }))).toBe('racion')
  })
})

describe('buscarAlimentos', () => {
  const lista = [
    alimento('Arroz blanco crudo'),
    alimento('Tortitas de arroz'),
    alimento('Arroz blanco cocido'),
    alimento('Leche de arroz'),
    alimento('Pollo'),
  ]
  it('sin tildes, primero lo que empieza así y lo cocinado antes que lo crudo', () => {
    expect(buscarAlimentos(lista, 'ARRÓZ').map((a) => a.name)).toEqual([
      'Arroz blanco cocido',
      'Arroz blanco crudo',
      'Tortitas de arroz',
      'Leche de arroz',
    ])
    expect(buscarAlimentos(lista, '  ')).toEqual([])
  })
  it('varias palabras, en cualquier orden y sitio del nombre', () => {
    expect(buscarAlimentos(lista, 'cocido arroz').map((a) => a.name)).toEqual(['Arroz blanco cocido'])
    expect(buscarAlimentos(lista, 'arroz leche').map((a) => a.name)).toEqual(['Leche de arroz'])
  })
})

describe('recientes', () => {
  it('los más apuntados primero, sin los añadidos rápidos', () => {
    const dias = [
      { date: '2026-11-04', apuntes: [apunte({ alimentoId: 'f_a' }), apunte({ alimentoId: 'f_b' })] },
      { date: '2026-11-05', apuntes: [apunte({ alimentoId: 'f_b' }), apunte({ alimentoId: null })] },
    ]
    expect(recientes(dias)).toEqual(['f_b', 'f_a'])
  })
})

describe('porComida', () => {
  it('las cuatro comidas en orden, con lo suyo', () => {
    const grupos = porComida([apunte({ comida: 'cena' }), apunte({ comida: 'desayuno' })])
    expect(grupos.map((g) => [g.id, g.apuntes.length])).toEqual([
      ['desayuno', 1],
      ['comida', 0],
      ['merienda', 0],
      ['cena', 1],
    ])
  })
})

describe('macrosIncompletos', () => {
  it('avisa si las kcal no salen de la proteína y faltan hidratos y grasa', () => {
    expect(macrosIncompletos({ kcal: 300, protein: 10, carbs: 0, fat: 0 })).toBe(true)
    expect(macrosIncompletos({ kcal: 120, protein: 26, carbs: 0, fat: 0 })).toBe(false)
  })
})
