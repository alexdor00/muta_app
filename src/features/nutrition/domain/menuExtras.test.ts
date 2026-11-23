// Algo más en una comida del menú (usuario, 2026-11-17).
import { describe, expect, it } from 'vitest'
import { menuVacio } from './menu.ts'
import type { Plato } from './recipes.ts'
import {
  conExtra,
  conGramosDeExtra,
  extrasDe,
  macrosDeExtra,
  extrasDeDias,
  sinExtra,
  totalDelDia,
} from './menuExtras.ts'

describe('algo más en una comida del menú', () => {
  const platano = {
    alimentoId: 'platano',
    nombre: 'Plátano',
    categoria: 'Frutas',
    gramos: 120,
    kcal: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
  }
  it('va todos los días del menú, suma al día, sale en la compra y se quita', () => {
    const lunes = '2026-11-16'
    let m = conExtra(menuVacio(), 'A', 'merienda', platano)
    expect(extrasDe(m, lunes, 'merienda').map((x) => x.nombre)).toEqual(['Plátano'])
    expect(totalDelDia(m, lunes, () => null).kcal).toBe(107)
    expect(extrasDeDias(m, [lunes])[0].lista).toEqual([
      { alimentoId: 'platano', nombre: 'Plátano', categoria: 'Frutas', g: 120, macro: null },
    ])
    m = sinExtra(m, 'A', 'merienda', 0)
    expect(extrasDe(m, lunes, 'merienda')).toEqual([])
  })
})

describe('otro plato como algo más', () => {
  it('cuenta su ración y en la compra pide sus ingredientes de una ración', () => {
    const tortilla = {
      alimentoId: null,
      platoId: 't',
      nombre: 'Tortilla',
      categoria: 'x',
      gramos: 0,
      kcal: 300,
      protein: 20,
      carbs: 10,
      fat: 18,
    }
    const m = conExtra(menuVacio(), 'A', 'cena', tortilla)
    expect(totalDelDia(m, '2026-11-16', () => null).kcal).toBe(300)
    const plato = {
      raciones: 2,
      ingredientes: [
        {
          alimentoId: 'huevo',
          nombre: 'Huevo',
          categoria: 'Huevos y lácteos',
          gramos: 240,
          cuenta: true,
          macro: 'protein',
        },
      ],
    } as unknown as Plato
    expect(extrasDeDias(m, ['2026-11-16'], () => plato)[0].lista[0].g).toBe(120)
  })
})

describe('cambiar la cantidad de algo más', () => {
  it('cambia los gramos; lo que aporta sale de ellos (macros por 100 g)', () => {
    const avena = {
      alimentoId: 'f_avena',
      nombre: 'Copos de avena',
      categoria: 'Cereales',
      gramos: 50,
      kcal: 188,
      protein: 6.5,
      carbs: 30,
      fat: 3.5,
    }
    const m = conExtra(menuVacio(), 'A', 'desayuno', avena)
    const x = conGramosDeExtra(m, 'A', 'desayuno', 0, 100).menus.find((y) => y.id === 'A')?.extras
      ?.desayuno?.[0]
    expect(x).toMatchObject({ gramos: 100, kcal: 188 })
    expect(x && macrosDeExtra(x).kcal).toBe(188)
  })
})
