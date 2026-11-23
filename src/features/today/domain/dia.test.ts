import { describe, expect, it } from 'vitest'
import type { TareaDeHoy } from '../../../shared/lib/tareaDeHoy.ts'
import { cuenta, fraseQueda, repartir } from './dia.ts'

const tarea = (id: string, orden: number, extra: Partial<TareaDeHoy> = {}): TareaDeHoy => ({
  id,
  orden,
  icono: 'peso',
  titulo: id,
  corta: id,
  detalle: '',
  hecha: false,
  ...extra,
})

describe('tu día en Hoy', () => {
  it('ordena por el día y separa lo hecho; lo marcado a mano cuenta como hecho', () => {
    const { quedan, hechas } = repartir(
      [tarea('compra', 1180, { aMano: true }), tarea('pesarte', 10, { hecha: true }), tarea('entrenar', 30)],
      ['compra'],
    )
    expect(quedan.map((t) => t.id)).toEqual(['entrenar'])
    expect(hechas.map((t) => t.id)).toEqual(['pesarte', 'compra'])
  })
  it('una tarjeta con partes (Nutrición): queda hasta que ella y todas sus partes están hechas; el anillo las cuenta', () => {
    const nutricion = tarea('comida', 40, {
      hecha: true,
      partes: [tarea('cena', 1360, { hecha: true }), tarea('compra', 1180, { aMano: true })],
    })
    const antes = repartir([nutricion], [])
    expect(antes.quedan.map((t) => t.id)).toEqual(['comida'])
    // Las partes, por la hora; la compra, marcada a mano, se tacha dentro
    expect(antes.quedan[0].partes?.map((t) => t.id)).toEqual(['compra', 'cena'])
    // Nutrición no cuenta como hecha (ni se tacha) mientras le quede algo: solo la cena
    expect(cuenta(antes.quedan)).toEqual({ total: 3, hechas: 1 })
    const despues = repartir([nutricion], ['compra'])
    expect(despues.hechas.map((t) => t.id)).toEqual(['comida'])
    expect(cuenta(despues.hechas)).toEqual({ total: 3, hechas: 3 })
  })
  it('solo se marca a mano lo que es a mano', () => {
    const { quedan } = repartir([tarea('entrenar', 30)], ['entrenar'])
    expect(quedan).toHaveLength(1)
  })
  it('dice lo que queda en una frase', () => {
    expect(fraseQueda([tarea('entrenar', 1), tarea('comer', 2), tarea('la compra', 3)])).toBe(
      'Entrenar, comer y la compra.',
    )
    expect(fraseQueda([tarea('tus pasos', 1)])).toBe('Tus pasos.')
    expect(fraseQueda([])).toBe('')
  })
})
