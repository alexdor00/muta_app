// De tus menús, lo que se cocina y se compra: la nevera y lo de hoy.
import { describe, expect, it } from 'vitest'
import { menuVacio } from './menu.ts'
import { DIAS_NEVERA, loDeHoy, pasanDeLaNevera } from './menuCocina.ts'

describe('lo cocinado aguanta 3 días en la nevera', () => {
  it('lo que cae más de 3 días después de cocinar, se hace al momento', () => {
    expect(DIAS_NEVERA).toBe(3)
    expect(pasanDeLaNevera('2026-11-16', ['2026-11-18|comida', '2026-11-20|cena'])).toEqual([
      '2026-11-20|cena',
    ])
  })
})

describe('lo de hoy', () => {
  it('la compra de hoy, con su hora; sin nada, vacío', () => {
    const m = { ...menuVacio(), compraEl: { fecha: '2026-11-16', hora: '10:00' } }
    expect(loDeHoy(m, '2026-11-16')).toEqual([{ id: 'compra', tipo: 'compra', hora: '10:00' }])
    expect(loDeHoy(m, '2026-11-17')).toEqual([])
  })
})
