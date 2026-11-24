// Encender o apagar algo de una lista de lo que falta (los discos que no hay en tu gimnasio). «Tu material» se quitó
// (usuario, 2026-11-24).
/** Pone o quita un material (o un disco) de lo que te falta. */
export function cambiarMaterial<T>(falta: readonly T[], id: T, tienes: boolean): T[] {
  const resto = falta.filter((m) => m !== id)
  return tienes ? resto : [...resto, id]
}
