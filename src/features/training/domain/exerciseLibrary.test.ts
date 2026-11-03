import { describe, expect, it } from 'vitest'
import { libraryLine, libraryProblems, searchLibrary, type LibraryExercise } from './exerciseLibrary.ts'

const ej = (over: Partial<LibraryExercise>): LibraryExercise => ({
  id: 'press_banca',
  name: 'Press banca',
  primary: 'pecho',
  contributes: { pecho: 1, triceps: 0.5 },
  kind: 'compound',
  equipment: 'barbell',
  pattern: 'empuje_h',
  gyms: ['gym'],
  reps: [6, 10],
  rir: 2,
  restSec: 180,
  stepKg: 2.5,
  heavy: true,
  stable: false,
  key: 'Escápulas atrás.',
  source: 'V3',
  ...over,
})

const LISTA = [
  ej({}),
  ej({ id: 'jalon', name: 'Jalón al pecho', primary: 'dorsal', equipment: 'cable' }),
  ej({ id: 'hip_thrust', name: 'Hip thrust', primary: 'gluteo' }),
]

describe('searchLibrary', () => {
  it('sin nada escrito ni músculo, todos en su orden', () => {
    expect(searchLibrary(LISTA, '', null).map((e) => e.id)).toEqual(['press_banca', 'jalon', 'hip_thrust'])
  })
  it('busca sin tildes ni mayúsculas', () => {
    expect(searchLibrary(LISTA, ' JALON ', null).map((e) => e.id)).toEqual(['jalon'])
    expect(searchLibrary(LISTA, 'pecho', null).map((e) => e.id)).toEqual(['jalon'])
  })
  it('filtra por el músculo principal', () => {
    expect(searchLibrary(LISTA, '', 'gluteo').map((e) => e.id)).toEqual(['hip_thrust'])
    expect(searchLibrary(LISTA, 'press', 'dorsal')).toEqual([])
  })
  it('los más típicos (los que más salen en las rutinas) primero; a igualdad, en su orden', () => {
    const usos = { hip_thrust: 160, jalon: 140 }
    expect(searchLibrary(LISTA, '', null, usos).map((e) => e.id)).toEqual([
      'hip_thrust',
      'jalon',
      'press_banca',
    ])
  })
})

describe('libraryLine', () => {
  it('músculo y material en minúscula', () => {
    expect(libraryLine(LISTA[0])).toBe('Pecho, barra')
    expect(libraryLine(LISTA[1])).toBe('Dorsal, polea')
  })
})

describe('libraryProblems', () => {
  it('una biblioteca correcta no tiene problemas', () => {
    expect(libraryProblems(LISTA)).toEqual([])
  })
  it('avisa de ids repetidos, músculos que no existen y reps al revés', () => {
    const mal = [
      ej({}),
      ej({ reps: [12, 8] }),
      ej({ id: 'x', contributes: { pecho: 1, nuca: 1 } as LibraryExercise['contributes'] }),
    ]
    expect(libraryProblems(mal)).toEqual([
      'press_banca: id repetido',
      'press_banca: reps 12–8 al revés',
      'x: suma a «nuca», que no existe',
    ])
  })
})
