import { describe, expect, it } from 'vitest'
import {
  conPlato,
  conTiposDeDia,
  huecoDe,
  huecosDelDia,
  platosDe,
  menuDelDia,
  menuVacio,
  type ExtraMenu,
  type MenuSemanal,
} from './menu.ts'
import {
  conPlatoDescanso,
  conCocinarEnCiclo,
  conComun,
  conDiasDeComida,
  diasDeComida,
  conComida,
  conDiaLibre,
  conDiaFijo,
  conSemanaFija,
  conHoyEsElDia,
  conLargo,
  conMenuEnCiclo,
  conMenuEseDia,
  conPersonas,
  conPorTipo,
  diaDeHoy,
  horaDeComida,
  llevaLoQueNoQuieres,
  nombreDeComida,
  porPersonas,
} from './menuPlan.ts'

const lunes = '2026-11-16'
const dosMenus = (): MenuSemanal => {
  const m = {
    ...menuVacio(),
    menus: [
      { id: 'A', nombre: 'Menú A', platos: {} },
      { id: 'B', nombre: 'Menú B', platos: {} },
    ],
  }
  return conPlato(conPlato(m, 'A', 'comida', 'pollo'), 'B', 'comida', 'salmon')
}

describe('las comidas', () => {
  it('su nombre y su hora: los tuyos o los de serie', () => {
    const m = conComida(menuVacio(), 'merienda', { nombre: 'Preentreno', hora: '18:00' })
    expect(nombreDeComida(m, 'merienda')).toBe('Preentreno')
    expect(horaDeComida(m, 'merienda')).toBe('18:00')
    expect(nombreDeComida(m, 'cena')).toBe('Cena')
    expect(nombreDeComida(conComida(m, 'merienda', { nombre: ' ' }), 'merienda')).toBe('Merienda')
  })
})

describe('un día', () => {
  it('otro menú solo ese día, y vuelve', () => {
    const m = conMenuEseDia(dosMenus(), lunes, 'B')
    expect(menuDelDia(m, lunes)?.id).toBe('B')
    expect(menuDelDia(m, '2026-11-17')?.id).toBe('A')
    expect(menuDelDia(conMenuEseDia(m, lunes, null), lunes)?.id).toBe('A')
  })

  it('día libre: sin comidas del menú', () => {
    const m = conDiaLibre(dosMenus(), lunes, true)
    expect(huecosDelDia(m, lunes)).toEqual([])
    expect(huecosDelDia(conDiaLibre(m, lunes, false), lunes)).toHaveLength(1)
  })
})

describe('cómo se repiten', () => {
  it('por días: el largo, el menú de cada día y los días de cocinar', () => {
    let m = conLargo(dosMenus(), 3, lunes)
    expect(m.ciclo?.menus).toEqual(['A', 'A', 'A'])
    m = conMenuEnCiclo(m, 2, 'B', lunes)
    expect(m.ciclo?.menus).toEqual(['A', 'B', 'A'])
    m = conCocinarEnCiclo(m, 1, true, lunes)
    expect(m.ciclo?.cocinar).toEqual([1])
    expect(conLargo(conLargo(m, 2, lunes), 4, lunes).ciclo?.menus).toEqual(['A', 'B', 'A', 'B'])
    expect(conCocinarEnCiclo(m, 1, false, lunes).ciclo?.cocinar).toBeUndefined()
  })

  it('hoy es el día que digas', () => {
    const m = conHoyEsElDia(conLargo(dosMenus(), 7, lunes), 2, '2026-11-19')
    expect(diaDeHoy(m, '2026-11-19')).toBe(2)
  })

  it('según el entreno: los de entreno se alternan', () => {
    const tipo = (f: string) => (['2026-11-18', '2026-11-22'].includes(f) ? 'descanso' : 'entreno')
    const m = conPorTipo(dosMenus(), { entreno: ['A', 'B'], descanso: ['C'] }, lunes, tipo)
    expect(m.ciclo?.menus.slice(0, 7)).toEqual(['A', 'B', 'C', 'A', 'B', 'A', 'C'])
    expect(m.porTipo?.entreno).toEqual(['A', 'B'])
  })
})

describe('personas y lo que no quieres', () => {
  it('de 1 a 8 personas', () => {
    expect(conPersonas(menuVacio(), 0).personas).toBe(1)
    expect(conPersonas(menuVacio(), 12).personas).toBe(8)
  })

  it('avisa si un plato lleva lo que no quieres, sin mirar tildes', () => {
    const m = { ...menuVacio(), noQuiero: ['champiñon'] }
    expect(llevaLoQueNoQuieres(m, [{ nombre: 'Champiñones laminados' }])).toBe('champiñon')
    expect(llevaLoQueNoQuieres(m, [{ nombre: 'Pollo' }])).toBeNull()
  })
})

describe('para varias personas', () => {
  it('la compra se multiplica; sin más personas, igual', () => {
    const rs = [{ id: 'x', lista: [{ g: 100 }, { g: null }] }]
    expect(porPersonas(rs, 3)[0].lista).toEqual([{ g: 300 }, { g: null }])
    expect(porPersonas(rs, 1)).toEqual(rs)
  })
})

describe('una comida de un menú', () => {
  const extra = (nombre: string): ExtraMenu => ({
    alimentoId: null,
    platoId: nombre,
    nombre,
    categoria: '',
    gramos: 0,
    kcal: 100,
    protein: 10,
    carbs: 10,
    fat: 1,
  })

  it('en todos los menús: se copia y se cambia una vez', () => {
    let m = conComun(dosMenus(), 'A', 'desayuno', true)
    m = conPlato(m, 'B', 'desayuno', 'batido')
    expect(m.menus.map((x) => x.platos.desayuno)).toEqual(['batido', 'batido'])
    m = conComun(m, 'A', 'desayuno', false)
    m = conPlato(m, 'B', 'desayuno', 'tostada')
    expect(m.menus.map((x) => x.platos.desayuno)).toEqual(['batido', 'tostada'])
  })

  it('solo los días de entreno: el plato pasa a ir como una ración, y vuelve a todos', () => {
    let m = conDiasDeComida(dosMenus(), 'A', 'comida', 'entreno', (id) => extra(id))
    expect(m.menus[0].platos.comida).toBeUndefined()
    expect(m.menus[0].extras?.comida?.[0]).toMatchObject({ platoId: 'pollo', solo: 'entreno' })
    expect(diasDeComida(m, 'A', 'comida')).toBe('entreno')
    m = conDiasDeComida(m, 'A', 'comida', 'todos', (id) => extra(id))
    expect(diasDeComida(m, 'A', 'comida')).toBe('todos')
    expect(m.menus[0].extras?.comida?.[0].solo).toBeUndefined()
  })
})

describe('platos de descanso', () => {
  it('por defecto, los mismos; cambiado, solo los días de descanso', () => {
    const m0 = conPlato(menuVacio(), 'A', 'comida', 'pollo')
    expect(platosDe(m0.menus[0], true).comida).toBe('pollo')
    const m = conPlatoDescanso(m0, 'A', 'comida', 'ensalada')
    expect(platosDe(m.menus[0], false).comida).toBe('pollo')
    expect(platosDe(m.menus[0], true).comida).toBe('ensalada')
    conTiposDeDia((f) => f === '2026-11-20')
    expect(huecoDe(m, '2026-11-20', 'comida')?.plato).toBe('ensalada')
    expect(huecoDe(m, '2026-11-19', 'comida')?.plato).toBe('pollo')
    conTiposDeDia(() => false)
    // el mismo que en entreno, o null, lo deja como en entreno
    expect(conPlatoDescanso(m, 'A', 'comida', 'pollo').menus[0].descanso).toBeUndefined()
  })
})

describe('un día fijo en tu semana', () => {
  it('pone el menú ese día todas las semanas y quita su cambio suelto', () => {
    const m = {
      ...dosMenus(),
      porDia: { '2026-11-17': 'A' },
      ciclo: { menus: ['A', 'B', 'B'], inicio: lunes },
    }
    const r = conDiaFijo(m, '2026-11-17', 'B', '2026-11-19')
    expect(r.ciclo).toBeUndefined()
    expect(r.porDia).toEqual({})
    expect(menuDelDia(r, '2026-11-17')?.id).toBe('B')
    expect(menuDelDia(r, '2026-11-24')?.id).toBe('B')
    // los demás días siguen como se veían esta semana
    expect(menuDelDia(r, '2026-11-16')?.id).toBe('A')
    expect(menuDelDia(r, '2026-11-18')?.id).toBe('B')
  })
})

describe('por semana', () => {
  it('deja fija la semana que se ve, con sus cambios sueltos', () => {
    const m = { ...dosMenus(), porDia: { '2026-11-17': 'A' }, ciclo: { menus: ['A', 'B'], inicio: lunes } }
    const r = conSemanaFija(m, '2026-11-19')
    expect(r.ciclo).toBeUndefined()
    expect(r.semana).toEqual(['A', 'B', 'A', 'B', 'A', 'B', 'A'])
    expect(menuDelDia(r, '2026-11-24')?.id).toBe('B')
  })
})
