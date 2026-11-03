import { describe, expect, it } from 'vitest'
import { compararConAntes, descansoTras, revisarNumeros, teclear } from './workoutSet.ts'

describe('teclear', () => {
  const kg = { campo: 'kg' as const, valor: '60', gris: '62,5', fresca: true, salto: 2.5 }

  it('la primera cifra sustituye lo escrito; las siguientes van detrás', () => {
    expect(teclear(kg, '7')).toEqual({ valor: '7', fresca: false })
    expect(teclear({ ...kg, fresca: false }, '5')).toEqual({ valor: '605', fresca: false })
  })

  it('coma solo en kilos; borrar quita la última cifra', () => {
    expect(teclear({ ...kg, valor: '62', fresca: false }, 'coma')).toEqual({ valor: '62,', fresca: false })
    expect(teclear(kg, 'coma')).toEqual({ valor: '0,', fresca: false })
    expect(teclear({ ...kg, campo: 'reps' }, 'coma')).toBeNull()
    expect(teclear(kg, 'borrar')).toEqual({ valor: '6', fresca: false })
  })

  it('más y menos suman el salto a lo escrito o, si está vacío, a lo gris', () => {
    expect(teclear(kg, 'mas')).toEqual({ valor: '62,5', fresca: true })
    expect(teclear({ ...kg, valor: '' }, 'menos')).toEqual({ valor: '60', fresca: true })
    expect(teclear({ ...kg, campo: 'reps', valor: '', gris: '8' }, 'mas')).toEqual({
      valor: '9',
      fresca: true,
    })
    expect(teclear({ ...kg, valor: '1' }, 'menos')?.valor).toBe('0')
  })

  it('no pasa del largo de la casilla', () => {
    expect(teclear({ ...kg, campo: 'quedan', valor: '2', fresca: false }, '3')).toBeNull()
  })
})

describe('compararConAntes', () => {
  it('mejor con una repetición más o más peso; igual dentro del 0,5 %; peor si baja', () => {
    expect(compararConAntes({ kg: 62.5, reps: 7 }, { kg: 62.5, reps: 6 })).toBe(1)
    expect(compararConAntes({ kg: 65, reps: 6 }, { kg: 62.5, reps: 6 })).toBe(1)
    expect(compararConAntes({ kg: 60, reps: 10 }, { kg: 60, reps: 10 })).toBe(0)
    expect(compararConAntes({ kg: 60, reps: 8 }, { kg: 60, reps: 10 })).toBe(-1)
  })

  it('sin la vez anterior o sin repeticiones no compara', () => {
    expect(compararConAntes({ kg: 60, reps: 8 }, null)).toBeNull()
    expect(compararConAntes({ kg: 60, reps: 0 }, { kg: 60, reps: 8 })).toBeNull()
  })
})

describe('descansoTras', () => {
  it('suma un minuto si las reps caen por debajo del 80 % de la primera serie con el mismo peso', () => {
    expect(descansoTras(165, [{ kg: 62.5, reps: 10 }], { kg: 62.5, reps: 7 })).toEqual({
      segundos: 225,
      bajada: { de: 10, a: 7 },
    })
  })

  it('no suma si bajó el peso, si la caída es pequeña o si no hay primera serie de 5 o más', () => {
    expect(descansoTras(165, [{ kg: 62.5, reps: 10 }], { kg: 50, reps: 7 }).bajada).toBeNull()
    expect(descansoTras(165, [{ kg: 62.5, reps: 10 }], { kg: 62.5, reps: 8 }).segundos).toBe(165)
    expect(descansoTras(165, [{ kg: 100, reps: 3 }], { kg: 100, reps: 1 }).segundos).toBe(165)
  })
})

describe('revisarNumeros', () => {
  it('rechaza lo imposible y pide confirmar lo muy alto', () => {
    expect(revisarNumeros(62.5, 8)).toBe('ok')
    expect(revisarNumeros(320, 5)).toBe('alto')
    expect(revisarNumeros(60, 60)).toBe('alto')
    expect(revisarNumeros(700, 5)).toBe('imposible')
    expect(revisarNumeros(60, 120)).toBe('imposible')
    expect(revisarNumeros(null, 12)).toBe('ok')
  })
})
