// El archivo de una dieta: guardarla y volver a leerla tal cual, con un ciclo de cualquier largo y sus días de cocinar.
import { describe, expect, it } from 'vitest'
import { dietaNueva } from './diet.ts'
import { aArchivo, leerDieta } from './dietArchivo.ts'

describe('el archivo de la dieta', () => {
  it('un ciclo de 6 días y los días de cocinar se guardan y se leen igual', () => {
    const d = { ...dietaNueva('d', 'Fase 1'), ciclo: ['A', 'A', 'A', 'A', 'A', 'A'], cocinar: [1, 3, 5] }
    const r = leerDieta(JSON.parse(aArchivo(d)))
    expect(r.ok && r.dieta.ciclo).toHaveLength(6)
    expect(r.ok && r.dieta.cocinar).toEqual([1, 3, 5])
  })
  it('los días de cocinar que no caben en el ciclo se quedan fuera', () => {
    const d = { ...dietaNueva('d', 'x'), ciclo: ['A', 'A'], cocinar: [1, 5] }
    const r = leerDieta(JSON.parse(aArchivo(d)))
    expect(r.ok && r.dieta.cocinar).toEqual([1])
  })
})
