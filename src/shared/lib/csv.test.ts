import { describe, expect, it } from 'vitest'
import { columnas, leerCsv } from './csv.ts'

describe('leerCsv', () => {
  it('títulos limpios, separador ; o , y comillas que agrupan', () => {
    const { titulos, filas } = leerCsv('﻿Menú;Ingrediente\nA;"Arroz; integral"\n\nB;Pollo')
    expect(titulos).toEqual(['menu', 'ingrediente'])
    expect(filas).toEqual([
      { fila: 2, celdas: ['A', 'Arroz; integral'] },
      { fila: 4, celdas: ['B', 'Pollo'] },
    ])
    expect(leerCsv('a,b\n1,2').filas[0].celdas).toEqual(['1', '2'])
  })
  it('columnas por sus nombres posibles', () => {
    expect(
      columnas(['menu', 'plato'], { menu: ['menu'], receta: ['receta', 'plato'], kcal: ['kcal'] }),
    ).toEqual({
      menu: 0,
      receta: 1,
      kcal: -1,
    })
  })
})
