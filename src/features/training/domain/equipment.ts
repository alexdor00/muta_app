// Tu material: lo que tienes donde entrenas. Se guarda lo que te falta, así que sin elegir nada lo tienes todo (como el
// gimnasio completo de la bienvenida). El peso corporal y «otro» cuentan siempre.

import type { Equipment } from './exerciseLibrary.ts'

/** El material que se puede quitar en Perfil, con su nombre. */
export const MATERIALES: readonly { id: Equipment; label: string }[] = [
  { id: 'barbell', label: 'Barra y discos' },
  { id: 'dumbbell', label: 'Mancuernas' },
  { id: 'machine', label: 'Máquinas' },
  { id: 'cable', label: 'Poleas' },
]

/** Si puedes hacer un ejercicio con tu material (sin saber su material, sí). */
export function loTienes(material: Equipment | null | undefined, falta: readonly Equipment[]): boolean {
  return !material || !falta.includes(material)
}

/** Separa una lista en lo que puedes hacer y lo que no, cada parte en su orden: lo que no, va al final. */
export function porMaterial<T>(
  lista: readonly T[],
  materialDe: (x: T) => Equipment | null | undefined,
  falta: readonly Equipment[],
): { tienes: T[]; noTienes: T[] } {
  const tienes: T[] = []
  const noTienes: T[] = []
  for (const x of lista) (loTienes(materialDe(x), falta) ? tienes : noTienes).push(x)
  return { tienes, noTienes }
}

/** Pone o quita un material (o un disco) de lo que te falta. */
export function cambiarMaterial<T>(falta: readonly T[], id: T, tienes: boolean): T[] {
  const resto = falta.filter((m) => m !== id)
  return tienes ? resto : [...resto, id]
}
