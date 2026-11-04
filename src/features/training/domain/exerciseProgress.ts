// Progreso de un ejercicio a lo largo del tiempo (ficha-ejercicio.js · exProgressHtml del prototipo): el máximo
// (1RM estimado de la mejor serie de cada vez) y el volumen (kilos × repeticiones de todas las series).
import { e1rm } from './e1rm.ts'

/** Cada vez que se hizo: su fecha, sus series y en qué puesto de la sesión iba (1 = el primero), si se sabe. */
export type VezEjercicio = {
  fecha: string
  series: { kg: number | null; reps: number }[]
  puesto?: number
}

export type PuntoProgreso = { fecha: string; maximo: number; volumen: number; puesto: number | null }

/** Un punto por cada vez, en su orden. `rir` es el del plan: el que se da por hecho si no se apuntó. */
export function progresoDe(veces: VezEjercicio[], rir: number): PuntoProgreso[] {
  return veces
    .filter((v) => v.series.some((s) => s.reps > 0))
    .map((v) => ({
      fecha: v.fecha,
      maximo: Math.round(Math.max(...v.series.map((s) => e1rm(s.kg, s.reps, rir))) * 10) / 10,
      volumen: v.series.reduce((t, s) => t + (s.kg ?? 0) * s.reps, 0),
      puesto: v.puesto ?? null,
    }))
}

/** Cuánto cambió el último valor desde el primero, en tanto por uno; null si hay menos de dos o el primero es 0. */
export function cambioDesdePrimera(valores: number[]): number | null {
  if (valores.length < 2 || !valores[0]) return null
  return valores[valores.length - 1] / valores[0] - 1
}

/**
 * Cuánto cambió la última vez frente a la anterior, en tanto por uno: el máximo (1RM estimado de la mejor serie) o, si se
 * hace sin peso, las repeticiones de la mejor serie. null si hay menos de dos veces o la anterior es 0.
 */
export function cambioUltimaVez(veces: VezEjercicio[], rir: number): number | null {
  const conReps = veces.filter((v) => v.series.some((s) => s.reps > 0))
  if (conReps.length < 2) return null
  const [antes, ahora] = conReps.slice(-2)
  const conPeso = [antes, ahora].every((v) => v.series.some((s) => (s.kg ?? 0) > 0))
  const valor = (v: VezEjercicio) =>
    conPeso
      ? Math.max(...v.series.map((s) => e1rm(s.kg, s.reps, rir)))
      : Math.max(...v.series.map((s) => s.reps))
  return valor(antes) > 0 ? valor(ahora) / valor(antes) - 1 : null
}

/**
 * Si la última vez y la anterior se hizo en distinto puesto de la sesión (con más o menos fatiga encima, la comparación
 * no es exacta): los dos puestos; null si fue en el mismo o no se sabe.
 */
export function avisoDeOrden(puntos: PuntoProgreso[]): { antes: number; ahora: number } | null {
  const [antes, ahora] = puntos.slice(-2).map((p) => p.puesto)
  return antes != null && ahora != null && antes !== ahora ? { antes, ahora } : null
}
