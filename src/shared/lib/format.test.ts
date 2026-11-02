import { describe, expect, it } from 'vitest'
import { formatChange, formatDayDate, formatDecimal, formatShortDate, formatTons } from './format.ts'

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
