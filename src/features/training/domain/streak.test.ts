import { describe, expect, it } from 'vitest'
import { diasDeRacha } from './streak.ts'

// Una rutina de 4 sesiones por semana: deja 3 días de descanso en cada semana, caigan donde caigan
const DESCANSOS = 3

describe('diasDeRacha', () => {
  it('los días de descanso que deja el plan cuentan para la racha', () => {
    // Jue 22, vie 23 entrenados; sáb 24 y dom 25 descanso; lun 26 y mar 27 entrenados
    const fechas = ['2026-10-22', '2026-10-23', '2026-10-26', '2026-10-27']
    expect(diasDeRacha(fechas, DESCANSOS, '2026-10-27')).toBe(6)
  })

  it('descansar más días de los que deja la semana la rompe', () => {
    // Semana del 19 al 25: solo se entrenó el lunes 19 (6 días sin entrenar, deja 3)
    expect(diasDeRacha(['2026-10-19', '2026-10-26', '2026-10-27'], DESCANSOS, '2026-10-27')).toBe(5)
  })

  it('hoy, si aún no has entrenado, no la rompe: cuenta desde ayer', () => {
    expect(diasDeRacha(['2026-10-23', '2026-10-26'], DESCANSOS, '2026-10-27')).toBe(4)
  })

  it('antes del primer entreno no hay racha', () => {
    expect(diasDeRacha([], DESCANSOS, '2026-10-27')).toBe(0)
    expect(diasDeRacha(['2026-10-26'], DESCANSOS, '2026-10-26')).toBe(1)
  })
})
