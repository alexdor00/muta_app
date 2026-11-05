import { describe, expect, it } from 'vitest'
import {
  calcularObjetivo,
  cuerpoValido,
  deficitDiario,
  factorActividad,
  gastoEnReposo,
  kcalAManoValidas,
  macrosObjetivo,
  suelo,
  superavitDiario,
  type Cuerpo,
} from './targets.ts'

const yo: Cuerpo = { sexo: 'hombre', edad: 30, alturaCm: 180, pesoKg: 80 }

describe('gastoEnReposo (Mifflin-St Jeor)', () => {
  it('hombre +5, mujer −161', () => {
    expect(gastoEnReposo(yo)).toBe(1780)
    expect(gastoEnReposo({ sexo: 'mujer', edad: 30, alturaCm: 165, pesoKg: 60 })).toBe(1320)
  })
})

describe('factorActividad', () => {
  it('pasos sobre 3.000 (hasta 8.000 más) y días de entreno, entre 1,3 y 1,95', () => {
    expect(factorActividad(9000, 4)).toBe(1.64)
    expect(factorActividad(2000, 0)).toBe(1.3)
    expect(factorActividad(30000, 6)).toBe(1.79)
    expect(factorActividad(11000, 20)).toBe(1.95)
  })
})

describe('suelo, déficit y superávit', () => {
  it('el suelo es el mayor de basal × 1,1 y 1.500 / 1.200', () => {
    expect(suelo(1780, 'hombre')).toBe(1958)
    expect(suelo(1100, 'mujer')).toBe(1210)
    expect(suelo(1000, 'mujer')).toBe(1200)
  })
  it('0,75 % de 80 kg por semana son 660 kcal al día; el superávit, al menos 75', () => {
    expect(deficitDiario(80, 0.75)).toBe(660)
    expect(superavitDiario(80)).toBe(77)
    expect(superavitDiario(50)).toBe(75)
  })
})

describe('calcularObjetivo', () => {
  it('definición: gasto menos el déficit del ritmo', () => {
    const c = calcularObjetivo({ cuerpo: yo, pasos: 9000, diasEntreno: 4, fase: 'definicion', ritmo: 0.75 })
    expect(c).toEqual({
      basal: 1780,
      factor: 1.64,
      gasto: 2919,
      cambio: -660,
      suelo: 1958,
      kcal: 2259,
      enSuelo: false,
    })
  })
  it('nunca por debajo del suelo', () => {
    const c = calcularObjetivo({
      cuerpo: { sexo: 'mujer', edad: 50, alturaCm: 155, pesoKg: 90 },
      pasos: 3000,
      diasEntreno: 2,
      fase: 'definicion',
      ritmo: 1,
    })
    expect(c.enSuelo).toBe(true)
    expect(c.kcal).toBe(c.suelo)
  })
  it('volumen suma; mantenimiento, el gasto', () => {
    expect(
      calcularObjetivo({ cuerpo: yo, pasos: 9000, diasEntreno: 4, fase: 'volumen', ritmo: 0.75 }).kcal,
    ).toBe(2996)
    expect(
      calcularObjetivo({ cuerpo: yo, pasos: 9000, diasEntreno: 4, fase: 'mantenimiento', ritmo: 0.75 }).kcal,
    ).toBe(2919)
  })
})

describe('macrosObjetivo', () => {
  it('proteína y grasa por kilo; los hidratos, lo que queda', () => {
    expect(macrosObjetivo(2259, 80, 1.5, 0.6)).toEqual({ kcal: 2259, protein: 120, carbs: 337, fat: 48 })
    expect(macrosObjetivo(1000, 100, 2.2, 1)).toEqual({ kcal: 1000, protein: 220, carbs: 0, fat: 100 })
  })
})

describe('validaciones', () => {
  it('kcal a mano entre 1.000 y 6.000; tus datos completos y razonables', () => {
    expect(kcalAManoValidas(2200)).toBe(true)
    expect(kcalAManoValidas(800)).toBe(false)
    expect(kcalAManoValidas(2200.5)).toBe(false)
    expect(cuerpoValido(yo)).toBe(true)
    expect(cuerpoValido({ ...yo, alturaCm: 18 })).toBe(false)
    expect(cuerpoValido({ sexo: 'hombre', edad: 30 })).toBe(false)
  })
})
