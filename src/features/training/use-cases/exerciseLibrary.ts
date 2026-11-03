import exercises from '../../../shared/content/exercises.json'
import { searchLibrary, type LibraryExercise } from '../domain/exerciseLibrary.ts'
import type { MuscleId } from '../domain/muscles.ts'

/** Los 141 ejercicios del prototipo anterior (scripts/exercises-from-prototype.cjs). */
export const LIBRARY = exercises as unknown as LibraryExercise[]

/** Un ejercicio por su id, o null si no está en la biblioteca. */
export function ejercicioDeBiblioteca(id: string): LibraryExercise | null {
  return LIBRARY.find((e) => e.id === id) ?? null
}

/** El id de un ejercicio por su nombre exacto (los de una sesión), o null si no está en la biblioteca. */
export function idPorNombre(nombre: string): string | null {
  return LIBRARY.find((e) => e.name === nombre)?.id ?? null
}

/** Buscar en la biblioteca por nombre y, si hay, por músculo principal. */
export function buscarEjercicios(query: string, muscle: MuscleId | null): LibraryExercise[] {
  return searchLibrary(LIBRARY, query, muscle)
}
