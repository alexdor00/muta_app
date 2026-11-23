import { describe, expect, it } from 'vitest'
import { leerOllas, pesoDeLaComida, rindeDe, SIN_OLLAS } from './ollas.ts'

describe('tus ollas', () => {
  it('lee lo guardado sin lo que no tiene forma de olla', () => {
    expect(leerOllas(null)).toEqual(SIN_OLLAS)
    const o = leerOllas({
      lista: [
        { id: 'a', nombre: 'Olla grande', gramos: 1240 },
        { id: 'b', nombre: 'Sin peso' },
      ],
      dePlato: { 'rec-1': 'a', 'rec-2': 3 },
      rinde: { 'olla:rec-1': 1.4, 'ing:arroz': -1 },
      modo: { 'rec-1': 'partes', 'rec-2': 'otro' },
    })
    expect(o.lista.map((x) => x.id)).toEqual(['a'])
    expect(o.dePlato).toEqual({ 'rec-1': 'a' })
    expect(o.rinde).toEqual({ 'olla:rec-1': 1.4 })
    expect(o.modo).toEqual({ 'rec-1': 'partes' })
  })

  it('lo cocinado: la olla llena menos la vacía (o lo pesado, sin olla)', () => {
    const olla = { id: 'a', nombre: 'Olla grande', gramos: 1240 }
    expect(pesoDeLaComida(2860, olla)).toBe(1620)
    expect(pesoDeLaComida(900, olla)).toBeNull()
    expect(pesoDeLaComida(1620, null)).toBe(1620)
  })

  it('lo que rinde: lo pesado entre lo de la receta', () => {
    expect(rindeDe(1620, 1200)).toBe(1.35)
    expect(rindeDe(0, 1200)).toBeNull()
  })
})
