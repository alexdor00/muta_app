import aliases from '../../../shared/content/exercise-aliases.json'
import exercises from '../../../shared/content/exercises.json'
import { searchLibrary, type LibraryExercise } from '../domain/exerciseLibrary.ts'
import type { MuscleId } from '../domain/muscles.ts'

/** Los 141 ejercicios del prototipo anterior (scripts/exercises-from-prototype.cjs). */
export const LIBRARY = exercises as unknown as LibraryExercise[]

/** Un ejercicio por su id, o null si no está en la biblioteca. */
export function ejercicioDeBiblioteca(id: string): LibraryExercise | null {
  return LIBRARY.find((e) => e.id === id) ?? null
}

/** El id de un ejercicio por su nombre (los de una sesión), o null si no está en la biblioteca. */
export function idPorNombre(nombre: string): string | null {
  return porNombre(nombre)?.id ?? null
}

/** Buscar en la biblioteca por nombre y, si hay, por músculo principal. */
export function buscarEjercicios(query: string, muscle: MuscleId | null): LibraryExercise[] {
  return searchLibrary(LIBRARY, query, muscle)
}

/**
 * Nombres de las rutinas que son un ejercicio de la biblioteca con otro nombre (técnica, ángulo, una mano, superserie…),
 * revisados a mano uno a uno (decisión 2026-11-03): nombre → id.
 */
const ALIAS = aliases as Record<string, string>

/** Un ejercicio de la biblioteca por su nombre (sin mirar mayúsculas) o por su alias, o null. */
export function porNombre(nombre: string): LibraryExercise | null {
  const n = nombre.toLowerCase()
  const exacto = LIBRARY.find((e) => e.name.toLowerCase() === n)
  if (exacto) return exacto
  const id = ALIAS[nombre]
  return id ? ejercicioDeBiblioteca(id) : null
}
