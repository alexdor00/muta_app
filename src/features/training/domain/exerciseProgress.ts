// Progreso de un ejercicio a lo largo del tiempo (ficha-ejercicio.js · exProgressHtml del prototipo): el máximo
// (1RM estimado de la mejor serie de cada vez) y el tonelaje (kilos × repeticiones de todas las series, bajadas incluidas).
import { e1rm } from './e1rm.ts'

/** Cada vez que se hizo: su fecha, sus series y en qué puesto de la sesión iba (1 = el primero), si se sabe. */
export type VezEjercicio = {
  fecha: string
  series: { kg: number | null; reps: number; extra?: { kg: number | null; reps: number }[] }[]
  puesto?: number
}

export type PuntoProgreso = {
  fecha: string
  maximo: number
  volumen: number
  puesto: number | null
  /** La serie que dio el máximo de ese día (kilos y repeticiones). */
  mejor: { kg: number | null; reps: number }
}

/**
 * Un punto por día, en su orden (si lo hiciste dos veces el mismo día, cuenta como uno: su mejor serie y todo su
 * tonelaje). `rir` es el del plan: el que se da por hecho si no se apuntó.
 */
export function progresoDe(veces: VezEjercicio[], rir: number): PuntoProgreso[] {
  const puntos: PuntoProgreso[] = []
  for (const v of veces) {
    const hechas = v.series.filter((s) => s.reps > 0)
    if (!hechas.length) continue
    const mejor = hechas.reduce((m, s) => (e1rm(s.kg, s.reps, rir) > e1rm(m.kg, m.reps, rir) ? s : m))
    const punto: PuntoProgreso = {
      fecha: v.fecha,
      maximo: Math.round(e1rm(mejor.kg, mejor.reps, rir) * 10) / 10,
      // El tonelaje: kilos × repeticiones de todas las series, con sus bajadas o mini-series
      volumen: v.series.flatMap((s) => [s, ...(s.extra ?? [])]).reduce((t, s) => t + (s.kg ?? 0) * s.reps, 0),
      puesto: v.puesto ?? null,
      mejor: { kg: mejor.kg, reps: mejor.reps },
    }
    const mismoDia = puntos.at(-1)
    if (mismoDia?.fecha !== v.fecha) puntos.push(punto)
    else
      puntos[puntos.length - 1] = {
        ...(punto.maximo > mismoDia.maximo ? punto : mismoDia),
        volumen: mismoDia.volumen + punto.volumen,
      }
  }
  return puntos
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
