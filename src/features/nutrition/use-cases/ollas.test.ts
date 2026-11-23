// Tus ollas con una IndexedDB de mentira: guardar, cambiar, borrar (y dejar de ser la de sus recetas), lo que rinde y
// cómo repartes; también nombres vacíos y gramos con decimales.
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { SIN_OLLAS } from '../domain/ollas.ts'
import { ollas } from '../state/ollas.ts'
import { borrarOlla, guardarOlla, guardarRinde, modoDeReparto, ollaDeReceta } from './ollas.ts'

beforeEach(() => {
  ollas.value = SIN_OLLAS
})

describe('tus ollas', () => {
  it('guardar redondea los gramos y pone un nombre si no hay', async () => {
    const o = await guardarOlla('   ', 1234.6)
    expect(o).toMatchObject({ nombre: 'Olla', gramos: 1235 })
    expect(ollas.value.lista).toHaveLength(1)
  })

  it('con el mismo id se cambia, no se duplica', async () => {
    const o = await guardarOlla('Grande', 1500)
    await guardarOlla('Grande roja', 1600, o.id)
    expect(ollas.value.lista).toEqual([{ id: o.id, nombre: 'Grande roja', gramos: 1600 }])
  })

  it('borrar una olla la quita de sus recetas, sin tocar las demás', async () => {
    const a = await guardarOlla('A', 1000, 'a')
    const b = await guardarOlla('B', 2000, 'b')
    await ollaDeReceta('lentejas', a.id)
    await ollaDeReceta('arroz', b.id)
    await borrarOlla(a.id)
    expect(ollas.value.lista.map((x) => x.id)).toEqual(['b'])
    expect(ollas.value.dePlato).toEqual({ arroz: 'b' })
    // Borrar una que no existe no cambia nada
    await borrarOlla('no-existe')
    expect(ollas.value.lista).toHaveLength(1)
  })

  it('la olla de una receta se cambia y se quita', async () => {
    await ollaDeReceta('lentejas', 'a')
    await ollaDeReceta('lentejas', 'b')
    expect(ollas.value.dePlato).toEqual({ lentejas: 'b' })
    await ollaDeReceta('lentejas', null)
    expect(ollas.value.dePlato).toEqual({})
  })

  it('lo que rinde y cómo repartes se recuerdan por receta', async () => {
    await guardarRinde('olla:lentejas', 2.4)
    const antes = ollas.value
    // El mismo valor no vuelve a guardar
    await guardarRinde('olla:lentejas', 2.4)
    expect(ollas.value).toBe(antes)
    await guardarRinde('ing:arroz', 3)
    expect(ollas.value.rinde).toEqual({ 'olla:lentejas': 2.4, 'ing:arroz': 3 })
    await modoDeReparto('lentejas', 'partes')
    await modoDeReparto('lentejas', 'junto')
    expect(ollas.value.modo).toEqual({ lentejas: 'junto' })
  })
})
