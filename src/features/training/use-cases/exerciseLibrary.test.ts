import { describe, expect, it } from 'vitest'
import aliases from '../../../shared/content/exercise-aliases.json'
import { libraryProblems } from '../domain/exerciseLibrary.ts'
import {
  buscarEjercicios,
  ejercicioDeBiblioteca,
  idPorNombre,
  LIBRARY,
  porNombre,
} from './exerciseLibrary.ts'

describe('biblioteca de ejercicios', () => {
  it('trae los 141 ejercicios del prototipo, sin problemas', () => {
    expect(LIBRARY).toHaveLength(141)
    expect(libraryProblems(LIBRARY)).toEqual([])
  })
  it('cada ejercicio lleva su clave; sin fuente, solo los de cuello (el prototipo los marca «orientativos»)', () => {
    expect(LIBRARY.filter((e) => !e.key.trim())).toEqual([])
    const sinFuente = LIBRARY.filter((e) => !e.source.trim())
    expect(sinFuente.map((e) => e.primary)).toEqual(['cuello', 'cuello', 'cuello', 'cuello'])
    expect(sinFuente.every((e) => /orientativo|no trata el cuello/.test(e.key))).toBe(true)
  })
  it('encuentra un ejercicio por su id y por su nombre', () => {
    expect(ejercicioDeBiblioteca('peso_muerto_rumano')?.name).toBe('Peso muerto rumano')
    expect(ejercicioDeBiblioteca('no_existe')).toBeNull()
    expect(idPorNombre('Peso muerto rumano')).toBe('peso_muerto_rumano')
    expect(idPorNombre('Otro')).toBeNull()
    expect(porNombre('peso muerto RUMANO')?.id).toBe('peso_muerto_rumano')
  })
  it('un nombre de rutina con otro nombre lleva a su ejercicio; cada alias apunta a uno que existe', () => {
    expect(porNombre('Sentadilla trasera')?.id).toBe('sentadilla')
    expect(porNombre('Laterales en polea')?.id).toBe('elevaciones_laterales_en_polea')
    expect(porNombre('Crunch bicicleta')).toBeNull()
    const ids = new Set(LIBRARY.map((e) => e.id))
    expect(Object.values(aliases).filter((id) => !ids.has(id))).toEqual([])
  })
  it('busca en el contenido real', () => {
    expect(buscarEjercicios('jalón', null).map((e) => e.name)).toContain('Jalón al pecho')
    expect(buscarEjercicios('', 'pecho').every((e) => e.primary === 'pecho')).toBe(true)
  })
})
