// Qué días cocinas y cómo cubre cada tanda, como una dieta (usuario, 2026-11-17): cada menú N días, cocinar al empezar cada menú
// día que cocinas.
import { describe, expect, it } from 'vitest'
import {
  compraQueToca,
  fechasDeCompra,
  fechasDeTandas,
  huecosDeLaCompra,
  pilotoNuevo,
  platosDeTanda,
  porMenu,
  porVeces,
  tandasDe,
  type Piloto,
} from './autopilot.ts'
import { conCuantos, conDiasPorMenu, conPlato, menuVacio, type MenuSemanal } from './menu.ts'

// 2026-11-09 es lunes
const lunes = '2026-11-09'
const fecha = (n: number) => {
  const d = new Date(`${lunes}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const nunca = () => false

/** Tres menús de 2 días (A A B B C C A), cada uno con su comida y su cena, como el plan del PDF. */
function dieta(): MenuSemanal {
  let m = conCuantos(menuVacio(), 3)
  for (const [id, comida, cena] of [
    ['A', 'wrap', 'burrito'],
    ['B', 'butter', 'mediterraneo'],
    ['C', 'shakshuka', 'hamburguesa'],
  ] as const) {
    m = conPlato(m, id, 'comida', comida)
    m = conPlato(m, id, 'cena', cena)
  }
  return conDiasPorMenu(m, 2, lunes)
}

const piloto = (p: Partial<Piloto> = {}): Piloto => ({
  ...pilotoNuevo(lunes),
  cocina: { modo: 'menu', dias: [], hora: '12:00' },
  ...p,
})

describe('cada menú, varios días', () => {
  it('A A B B C C A con 2 días; vuelve a «seguidos»', () => {
    const m = dieta()
    expect(m.semana).toEqual(['A', 'A', 'B', 'B', 'C', 'C', 'A'])
    expect(m.reparto).toBe('seguidos')
    expect(conDiasPorMenu(m, 9, lunes).diasPorMenu).toBe(7)
  })
})

describe('cocinar al empezar cada menú', () => {
  it('el primer día de cada menú (y el primero de todos)', () => {
    expect(porMenu(dieta(), lunes, fecha(6), null)).toEqual([lunes, fecha(2), fecha(4), fecha(6)])
  })
  it('un menú de más de 3 días se vuelve a cocinar al tercero', () => {
    const m = conPlato(menuVacio(), 'A', 'comida', 'pollo')
    expect(porMenu(m, lunes, fecha(6), null)).toEqual([lunes, fecha(3), fecha(6)])
  })
  it('con un solo menú, desde la última vez que cocinaste, cada 3 días', () => {
    const m = conPlato(menuVacio(), 'A', 'comida', 'pollo')
    expect(porMenu(m, fecha(1), fecha(6), lunes)).toEqual([fecha(3), fecha(6)])
  })
  it('cada tanda cubre los días enteros de su menú', () => {
    const m = dieta()
    const p = piloto()
    const fechas = fechasDeTandas(p, fecha(6), nunca, m)
    const [primera, segunda] = tandasDe(m, p, fechas)
    expect(primera.huecos.map((h) => `${h.fecha}|${h.comida}`)).toEqual([
      `${lunes}|comida`,
      `${lunes}|cena`,
      `${fecha(1)}|comida`,
      `${fecha(1)}|cena`,
    ])
    expect(platosDeTanda(primera)).toEqual([
      { plato: 'wrap', raciones: 2 },
      { plato: 'burrito', raciones: 2 },
    ])
    expect(platosDeTanda(segunda).map((x) => x.plato)).toEqual(['butter', 'mediterraneo'])
  })
})

describe('cocinar por la tarde', () => {
  it('la tarde de antes de cada menú, para todos sus días', () => {
    const m = dieta()
    const p = piloto({ cocina: { modo: 'menu', dias: [], hora: '20:30' } })
    const ts = tandasDe(m, p, fechasDeTandas(p, fecha(6), nunca, m))
    expect(ts.map((x) => x.fecha)).toEqual([lunes, fecha(1), fecha(3), fecha(5)])
    expect(platosDeTanda(ts[1]).map((x) => x.plato)).toEqual(['butter', 'mediterraneo'])
  })
})

describe('comprar el día que cocinas', () => {
  it('la compra es tu próximo día de cocina y llega hasta el siguiente', () => {
    const m = dieta()
    const p = piloto({ compra: { dia: 5, hora: '11:00', conCocina: true } })
    const fechas = fechasDeTandas(p, fecha(6), nunca, m)
    const ts = tandasDe(m, p, fechas)
    expect(compraQueToca(p, fecha(1), fechas)).toBe(fecha(2))
    expect(fechasDeCompra(p, [lunes, fecha(1), fecha(2)], fechas)).toEqual([lunes, fecha(2)])
    const pide = huecosDeLaCompra(m, ts, fecha(2), fecha(4))
    expect([...new Set(pide.map((h) => h.plato))]).toEqual(['butter', 'mediterraneo'])
  })
  it('con un día fijo, ese día de la semana', () => {
    const p = piloto({ compra: { dia: 5, hora: '11:00' } })
    expect(compraQueToca(p, lunes)).toBe(fecha(5))
  })
})

describe('¿cuántas veces a la semana cocinas?', () => {
  it('con tu dieta y 3 veces, los días que empieza cada menú', () => {
    expect(porVeces(dieta(), lunes, fecha(6), 3, null, nunca)).toEqual([lunes, fecha(2), fecha(4)])
  })
  it('con un solo menú y 2 veces, en tus descansos (miércoles y sábado), desde la última vez', () => {
    const m = conPlato(menuVacio(), 'A', 'comida', 'pollo')
    const descansa = (f: string) => f === fecha(2) || f === fecha(5)
    expect(porVeces(m, lunes, fecha(6), 2, fecha(-1), descansa)).toEqual([fecha(2), fecha(5)])
  })
  it('lo que añades a mano entra y lo que quitas no', () => {
    const m = dieta()
    const p = piloto({
      cocina: { modo: 'veces', veces: 3, dias: [], hora: '12:00' },
      anadidas: [fecha(6)],
      saltadas: [fecha(2)],
    })
    expect(fechasDeTandas(p, fecha(6), nunca, m)).toEqual([lunes, fecha(4), fecha(6)])
  })
})
