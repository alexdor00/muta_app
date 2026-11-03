import { describe, expect, it } from 'vitest'
import { diasDeRacha } from './streak.ts'

// Plan de lunes, martes, jueves y viernes: descansa miércoles, sábado y domingo
const DESCANSOS = [2, 5, 6]

describe('diasDeRacha', () => {
  it('los días de descanso del plan cuentan para la racha', () => {
    // Jue 22, vie 23 entrenados; sáb 24 y dom 25 descanso; lun 26 y mar 27 entrenados
    const fechas = ['2026-10-22', '2026-10-23', '2026-10-26', '2026-10-27']
    expect(diasDeRacha(fechas, DESCANSOS, '2026-10-27')).toBe(6)
  })

  it('un día de entreno sin entrenar la rompe', () => {
    // El lunes 26 tocaba y no se entrenó
    expect(diasDeRacha(['2026-10-23', '2026-10-27'], DESCANSOS, '2026-10-27')).toBe(1)
  })

  it('hoy, si aún no has entrenado, no la rompe: cuenta desde ayer', () => {
    expect(diasDeRacha(['2026-10-23', '2026-10-26'], DESCANSOS, '2026-10-27')).toBe(4)
  })

  it('hoy, si es día de descanso, ya cuenta', () => {
    expect(diasDeRacha(['2026-10-26', '2026-10-27'], DESCANSOS, '2026-10-28')).toBe(3)
  })

  it('antes del primer entreno no hay racha', () => {
    expect(diasDeRacha([], DESCANSOS, '2026-10-27')).toBe(0)
    // Descansos de antes del primer entreno no cuentan
    expect(diasDeRacha(['2026-10-26'], DESCANSOS, '2026-10-26')).toBe(1)
  })
})
