import { describe, expect, it } from 'vitest'
import {
  calendarioDelMenu,
  clave,
  conCocinado,
  conHueco,
  huecosDelDia,
  loDeHoy,
  menuVacio,
  paraCocinar,
  recetasDelMenu,
  sinHueco,
  totalDelDia,
  type Hueco,
  type MenuSemanal,
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
const hueco = (fecha: string, comida: Hueco['comida'], gramos: Hueco['gramos'] = null): Hueco => ({
  fecha,
  comida,
  plato: plato.id,
  gramos,
  cocinado: null,
})

describe('menú', () => {
  it('pone, cambia y quita platos; un día sale en el orden de las comidas', () => {
    let m = conHueco(menuVacio(), hueco('2026-11-09', 'cena'))
    m = conHueco(m, hueco('2026-11-09', 'comida'))
    m = conHueco(m, hueco('2026-11-09', 'cena', [200, null]))
    expect(huecosDelDia(m, '2026-11-09').map((h) => h.comida)).toEqual(['comida', 'cena'])
    expect(huecosDelDia(m, '2026-11-09')[1].gramos).toEqual([200, null])
    expect(sinHueco(m, '2026-11-09', 'cena').huecos).toHaveLength(1)
  })

  it('un cocinado marca sus comidas; cambiar el plato de una la saca del cocinado', () => {
    let m = conHueco(
      conHueco(menuVacio(), hueco('2026-11-09', 'comida')),
      hueco('2026-11-10', 'comida', [150, null]),
    )
    m = conCocinado(m, {
      id: 'c1',
      plato: plato.id,
      fecha: '2026-11-08',
      hora: '18:00',
      para: [clave('2026-11-09', 'comida'), clave('2026-11-10', 'comida')],
    })
    expect(m.huecos.every((h) => h.cocinado === 'c1')).toBe(true)
    expect(paraCocinar(m, m.cocinados[0], plato).map((i) => i.gramos)).toEqual([330, null])
    const otro = conHueco(m, { ...hueco('2026-11-10', 'comida'), plato: 'rec-2' })
    expect(otro.cocinados[0].para).toEqual([clave('2026-11-09', 'comida')])
    expect(otro.huecos.find((h) => h.fecha === '2026-11-10')?.cocinado).toBeNull()
  })

  it('lo de hoy: la compra y lo que cocinas por hora, y después lo que comes', () => {
    let m: MenuSemanal = {
      ...conHueco(menuVacio(), hueco('2026-11-09', 'comida')),
      compraEl: { fecha: '2026-11-08', hora: '11:00' },
    }
    m = conHueco(m, hueco('2026-11-08', 'cena'))
    m = conCocinado(m, {
      id: 'c1',
      plato: plato.id,
      fecha: '2026-11-08',
      hora: '18:00',
      para: [clave('2026-11-09', 'comida')],
    })
    expect(loDeHoy(m, '2026-11-08').map((t) => t.tipo)).toEqual(['compra', 'cocinar', 'comida'])
    const manana = loDeHoy(m, '2026-11-09')
    expect(manana).toHaveLength(1)
    expect(manana[0].tipo === 'comida' && manana[0].yaCocinado).toBe(true)
  })

  it('suma un día y da las recetas para la compra con los gramos ajustados', () => {
    const m = conHueco(
      conHueco(menuVacio(), hueco('2026-11-09', 'comida', [280, null])),
      hueco('2026-11-09', 'cena'),
    )
    expect(totalDelDia(m, '2026-11-09', platoDe).protein).toBe(35 + 23 + 35)
    const r = recetasDelMenu(m, ['2026-11-09'], platoDe)
    expect(r.map((x) => x.lista[0].g)).toEqual([280, 180])
    expect(r[0].lista[1].g).toBeNull()
  })

  it('el calendario lleva cada hora con su alarma antes', () => {
    let m: MenuSemanal = { ...menuVacio(), compraEl: { fecha: '2026-11-08', hora: '11:00' } }
    m = conCocinado(conHueco(m, hueco('2026-11-09', 'comida')), {
      id: 'c1',
      plato: plato.id,
      fecha: '2026-11-08',
      hora: '18:00',
      para: [clave('2026-11-09', 'comida')],
    })
    const ics = calendarioDelMenu(m, ['2026-11-08', '2026-11-09'], () => plato.nombre, '20261106T120000Z')
    expect(ics).toContain('DTSTART:20261108T110000')
    expect(ics).toContain('SUMMARY:Cocinar: Pollo al chipotle')
    expect(ics).toContain('TRIGGER:-PT30M')
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
  })
})
