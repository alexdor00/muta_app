// Tu semana en Editar rutina como una sola lista: tus sesiones en tu orden y, detrás de cada una, sus días de descanso. Se
// mueve con el dedo (sesiones y descansos) y se añaden sesiones tuyas (vacías). Se guarda en tu plan como el orden de las
// sesiones (`orden`, por sigla), los descansos tras cada una y las sesiones que añadiste (`propias`).
import type { SesionPlan } from './workoutPlan.ts'

/** Una fila de tu semana: una sesión (por su sigla) o un día de descanso. */
export type FilaSemana = { tipo: 'sesion'; sigla: string } | { tipo: 'descanso' }

/** Una sesión que añadiste tú: su sigla y su nombre de serie («Sesión 5»). */
export type SesionPropia = { sigla: string; nombre: string }

/** La lista de tu semana: cada sesión y, detrás, sus descansos (`porSesion`, en el orden de `siglas`). */
export function filasDeSemana(siglas: readonly string[], porSesion: readonly number[]): FilaSemana[] {
  return siglas.flatMap((sigla, i) => [
    { tipo: 'sesion' as const, sigla },
    ...Array.from({ length: porSesion[i] ?? 0 }, () => ({ tipo: 'descanso' as const })),
  ])
}

/**
 * Al revés: el orden de las sesiones y cuántos descansos van detrás de cada una. Los descansos que quedan arriba, antes
 * de la primera sesión, van tras la última (la semana da la vuelta).
 */
export function semanaDeFilas(filas: readonly FilaSemana[]): { orden: string[]; porSesion: number[] } {
  const orden: string[] = []
  const porSesion: number[] = []
  let antes = 0
  for (const f of filas) {
    if (f.tipo === 'sesion') {
      orden.push(f.sigla)
      porSesion.push(0)
    } else if (porSesion.length) porSesion[porSesion.length - 1] += 1
    else antes += 1
  }
  if (antes && porSesion.length) porSesion[porSesion.length - 1] += antes
  return { orden, porSesion }
}

/** La lista con la fila `de` puesta en el puesto `a`. */
export function moverFila<T>(filas: readonly T[], de: number, a: number): T[] {
  const lista = [...filas]
  const [x] = lista.splice(de, 1)
  lista.splice(a, 0, x)
  return lista
}

/** Tus sesiones en tu orden; las que no están en `orden` (nuevas en la rutina), detrás en el suyo. */
export function ordenarSemana<T extends { sigla: string }>(
  semana: readonly T[],
  orden: readonly string[] | null,
): T[] {
  if (!orden?.length) return [...semana]
  const puesto = (s: T) => {
    const i = orden.indexOf(s.sigla)
    return i < 0 ? Number.MAX_SAFE_INTEGER : i
  }
  return semana
    .map((s, i) => ({ s, i }))
    .sort((a, b) => puesto(a.s) - puesto(b.s) || a.i - b.i)
    .map(({ s }) => s)
}

/** La sigla de una sesión nueva: «S» y el primer número libre desde el siguiente a las que hay («S5»). */
export function siglaNueva(siglas: readonly string[]): string {
  let n = siglas.length + 1
  while (siglas.includes(`S${n}`)) n += 1
  return `S${n}`
}

/** Una sesión tuya, sin ejercicios hasta que se los añadas (en Editar rutina). */
export const sesionVacia = (p: SesionPropia): SesionPlan => ({ ...p, minutos: 0, ejercicios: [] })
