import { describe, expect, it } from 'vitest'
import {
  formatChange,
  formatClock,
  formatDayDate,
  formatDecimal,
  formatShortDate,
  formatTons,
  parseDecimal,
  plainText,
} from './format.ts'

describe('plainText', () => {
  it('quita tildes y mayúsculas para buscar', () => {
    expect(plainText('Glúteo')).toBe('gluteo')
    expect(plainText('Jalón al PECHO')).toBe('jalon al pecho')
  })
})

describe('parseDecimal', () => {
  it('lee la coma decimal; vacío es null', () => {
    expect(parseDecimal('62,5')).toBe(62.5)
    expect(parseDecimal(' 8 ')).toBe(8)
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal(',')).toBeNull()
  })
})

describe('formatClock', () => {
  it('minutos y segundos; horas solo si las hay', () => {
    expect(formatClock(4)).toBe('0:04')
    expect(formatClock(165)).toBe('2:45')
    expect(formatClock(3909)).toBe('1:05:09')
  })
})

describe('fechas', () => {
  it('día y mes abreviado, sin punto; con el día de la semana delante', () => {
    expect(formatShortDate('2026-09-18')).toBe('18 sep')
    expect(formatDayDate('2026-10-23')).toBe('Vie 23 oct')
    expect(formatDayDate('2026-01-04')).toBe('Dom 4 ene')
  })
})

describe('formatDecimal', () => {
  it('coma decimal', () => {
    expect(formatDecimal(2.5)).toBe('2,5')
    expect(formatDecimal(8)).toBe('8')
    expect(formatDecimal(1.25)).toBe('1,25')
  })
})

describe('formatTons', () => {
  it('usa coma decimal y un decimal como mucho', () => {
    expect(formatTons(7.1)).toBe('7,1 t')
    expect(formatTons(7)).toBe('7 t')
    expect(formatTons(6.66)).toBe('6,7 t')
  })
})

describe('formatChange', () => {
  it('lleva signo (menos tipográfico) y redondea al entero', () => {
    expect(formatChange(-0.066)).toBe('−7 %')
    expect(formatChange(0.024)).toBe('+2 %')
    expect(formatChange(0.001)).toBe('0 %')
  })
})
