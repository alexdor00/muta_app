import aliases from '../../../shared/content/exercise-aliases.json'
import exercises from '../../../shared/content/exercises.json'
import { LOCAL_EXERCISES, LOCAL_USES } from '../../../shared/data/localExercises.ts'
import { equivalentes, type Equivalente } from '../domain/equivalence.ts'
import { searchLibrary, type LibraryExercise } from '../domain/exerciseLibrary.ts'
import type { MuscleId } from '../domain/muscles.ts'

/** Los 141 ejercicios del prototipo anterior (scripts/exercises-from-prototype.cjs). */
export const LIBRARY = exercises as unknown as LibraryExercise[]

/** La biblioteca que se usa: la de MUTA y los ejercicios originales de tus rutinas locales (si los hay). */
export const BIBLIOTECA: LibraryExercise[] = [...LIBRARY, ...(LOCAL_EXERCISES as LibraryExercise[])]

/** Un ejercicio por su id, o null si no está en la biblioteca. */
export function ejercicioDeBiblioteca(id: string): LibraryExercise | null {
  return BIBLIOTECA.find((e) => e.id === id) ?? null
}

/** El id de un ejercicio por su nombre (los de una sesión), o null si no está en la biblioteca. */
export function idPorNombre(nombre: string): string | null {
  return porNombre(nombre)?.id ?? null
}

/** Buscar en la biblioteca por nombre y, si hay, por músculo principal. */
export function buscarEjercicios(query: string, muscle: MuscleId | null): LibraryExercise[] {
  return searchLibrary(BIBLIOTECA, query, muscle, LOCAL_USES)
}

/**
 * Nombres de las rutinas que son un ejercicio de la biblioteca con otro nombre (técnica, ángulo, una mano, superserie…),
 * revisados a mano uno a uno (decisión 2026-11-03): nombre → id.
 */
const ALIAS = aliases as Record<string, string>

/** Sin el prefijo de superserie ni de serie top o de descarga («A1: Curl araña» → «Curl araña»). */
const sinPrefijo = (n: string) =>
  n.replace(/^(Superserie \+ )?[A-E]\d+[.:]\s*|^Serie (top|de descarga):\s*/, '')

/** Un ejercicio de la biblioteca por su nombre (sin mirar mayúsculas ni el prefijo de superserie) o su alias, o null. */
export function porNombre(nombre: string): LibraryExercise | null {
  for (const k of new Set([nombre, sinPrefijo(nombre)])) {
    const n = k.toLowerCase()
    const exacto = BIBLIOTECA.find(
      (e) => e.name.toLowerCase() === n || e.alias?.some((a) => a.toLowerCase() === n),
    )
    if (exacto) return exacto
    if (ALIAS[k]) return ejercicioDeBiblioteca(ALIAS[k])
  }
  return null
}

/**
 * Los ejercicios de la biblioteca que hacen lo mismo que uno de tu sesión (mismo músculo, misma zona; domain/equivalence.ts).
 * Si está en la biblioteca, también su patrón.
 */
export function equivalentesDe(e: {
  nombre: string
  original?: string
  musculo: MuscleId | null
  compuesto: boolean
  secundarios: readonly MuscleId[]
}): Equivalente[] {
  const lib = porNombre(e.nombre)
  return equivalentes({ ...e, id: lib?.id, patron: lib?.pattern }, BIBLIOTECA)
}
