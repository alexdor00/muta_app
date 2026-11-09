import { describe, expect, it } from 'vitest'
import {
  calendarioDelMenu,
  clave,
  conAjuste,
  conCocinado,
  conCuantos,
  conDia,
  conPlato,
  conSinPlato,
  diaSemana,
  diasDelMenu,
  duplicado,
  huecosDelDia,
  leerMenu,
  loDeHoy,
  menuDelDia,
  menuVacio,
  paraCocinar,
  recetasDelMenu,
  sinMenu,
  totalDelDia,
  type MenuSemanal,
  paraCongelar,
} from './menu.ts'
import type { Plato } from './recipes.ts'

const plato: Plato = {
  id: 'rec-1',
  numero: 1,
  nombre: 'Pollo al chipotle',
  categoria: 'carne',
  dificultad: 'Fácil',
  minutos: 40,
  raciones: 1,
  total: { kcal: 475, protein: 35, carbs: 68, fat: 7 },
  ingredientes: [
    {
      texto: '180 g de pechuga de pollo',
      nombre: 'Pechuga de pollo',
      categoria: 'Carnes',
      por100: { kcal: 110, protein: 23, carbs: 0, fat: 2 },
      alimentoId: 'f_pollo',
      cuenta: true,
      gramos: 180,
      sugerido: false,
      macro: 'protein',
    },
    {
      texto: 'Sal al gusto',
      nombre: 'Sal al gusto',
      categoria: 'Platos',
      por100: null,
      alimentoId: null,
      cuenta: false,
      gramos: null,
      sugerido: false,
      macro: null,
    },
  ],
  pasos: [],
  ajustable: true,
  origen: 'recetario',
}
const platoDe = (id: string) => (id === plato.id ? plato : null)
// 2026-11-09 es lunes
const lunes = '2026-11-09'

describe('tus menús', () => {
  it('quitar el plato de una comida solo un día: ese día no hay hueco; los demás, sí; se vuelve a poner', () => {
    const m = conPlato(menuVacio(), 'A', 'cena', plato.id)
    const sin = conSinPlato(m, lunes, 'cena', true, lunes)
    expect(huecosDelDia(sin, lunes)).toEqual([])
    expect(huecosDelDia(sin, '2026-11-10')).toHaveLength(1)
    expect(huecosDelDia(conSinPlato(sin, lunes, 'cena', false, lunes), lunes)).toHaveLength(1)
    // Lo de hace más de una semana se olvida
    expect(conSinPlato(sin, '2026-11-30', 'comida', true, '2026-11-30').sinPlato).toEqual([
      '2026-11-30|comida',
    ])
    expect(leerMenu({ ...m, sinPlato: undefined }).sinPlato).toEqual([])
  })

  it('de 1 a 7 menús, seguidos por la semana; quitar uno rehace la semana', () => {
    expect(diaSemana(lunes)).toBe(0)
    const tres = conCuantos(menuVacio(), 3)
    expect(tres.menus.map((x) => x.nombre)).toEqual(['Menú A', 'Menú B', 'Menú C'])
    expect(tres.semana.join('')).toBe('ABCABCA')
    expect(conCuantos(tres, 9).menus).toHaveLength(7)
    expect(sinMenu(tres, 'B').semana.join('')).toBe('ACACACA')
    expect(sinMenu(menuVacio(), 'A').menus).toHaveLength(1)
  })

  it('un día a mano pasa a «elegidos»; duplicar copia los platos con la siguiente letra', () => {
    let m = conPlato(conCuantos(menuVacio(), 2), 'A', 'cena', plato.id)
    m = conDia(m, 1, 'A')
    expect(m.reparto).toBe('elegidos')
    expect(menuDelDia(m, '2026-11-10')?.id).toBe('A')
    expect(diasDelMenu(m, 'B', lunes)).toEqual(['2026-11-12', '2026-11-14'])
    const copia = duplicado(m, 'A')
    expect(copia?.menus[2]).toMatchObject({ id: 'C', platos: { cena: plato.id } })
  })

  it('lo de un día sale del menú de ese día; lo guardado con la forma antigua empieza de nuevo', () => {
    const m = conPlato(menuVacio(), 'A', 'comida', plato.id)
    expect(huecosDelDia(m, lunes)).toEqual([
      { fecha: lunes, comida: 'comida', menu: 'A', plato: plato.id, cocinado: null },
    ])
    expect(totalDelDia(m, lunes, () => plato.total).kcal).toBe(475)
    expect(leerMenu({ id: 'menu', huecos: [] }).menus).toHaveLength(1)
  })

  it('un cocinado junta las comidas; lo de hoy lleva la compra y lo que cocinas por hora', () => {
    let m: MenuSemanal = {
      ...conPlato(menuVacio(), 'A', 'comida', plato.id),
      compraEl: { fecha: lunes, hora: '11:00' },
    }
    m = conCocinado(m, {
      id: 'c1',
      plato: plato.id,
      fecha: lunes,
      hora: '18:00',
      para: [clave('2026-11-10', 'comida'), clave('2026-11-11', 'comida')],
    })
    expect(huecosDelDia(m, '2026-11-10')[0].cocinado).toBe('c1')
    expect(paraCocinar(m, m.cocinados[0], plato, () => [200, null]).map((i) => i.gramos)).toEqual([400, null])
    expect(loDeHoy(m, lunes).map((t) => t.tipo)).toEqual(['compra', 'cocinar'])
    const r = recetasDelMenu(m, [lunes], platoDe, () => [280, null])
    expect(r[0].lista.map((x) => x.g)).toEqual([280, null])
  })

  it('el calendario lleva cada hora con su alarma antes', () => {
    let m: MenuSemanal = {
      ...conPlato(menuVacio(), 'A', 'comida', plato.id),
      compraEl: { fecha: lunes, hora: '11:00' },
    }
    m = conCocinado(m, {
      id: 'c1',
      plato: plato.id,
      fecha: lunes,
      hora: '18:00',
      para: [clave(lunes, 'comida')],
    })
    const ics = calendarioDelMenu(m, [lunes], () => plato.nombre, '20261106T120000Z')
    expect(ics).toContain('DTSTART:20261109T110000')
    expect(ics).toContain('SUMMARY:Cocinar: Pollo al chipotle')
    expect(ics).toContain('TRIGGER:-PT30M')
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
  })
})

describe('gramos de una comida', () => {
  it('una comida puede ir con los gramos de la receta y volver a ajustarse', () => {
    const m = conAjuste(conPlato(menuVacio(), 'A', 'cena', 'rec-1'), 'A', 'cena', false)
    expect(m.menus[0].fijos).toEqual(['cena'])
    expect(conAjuste(m, 'A', 'cena', true).menus[0].fijos).toEqual([])
  })
})

describe('paraCongelar', () => {
  it('lo que se come más de 3 días después de cocinarlo', () => {
    expect(paraCongelar('2026-11-09', ['2026-11-10|comida', '2026-11-12|cena', '2026-11-13|comida'])).toEqual(
      ['2026-11-13|comida'],
    )
  })
})
