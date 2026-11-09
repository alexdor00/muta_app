// Cómo va tu rendimiento sesión a sesión (para la recarga de hidratos de Nutrición, decisión 2026-11-09): una sesión va
// peor si el 10 % o más de sus series bajan frente a la misma serie de la vez anterior. Una sola sesión mala no cuenta: lo
// que importa es que varias recientes vayan peor cuando antes venías estable o mejorando.
import { addDays } from '../../../shared/lib/format.ts'
import type { Entreno } from './workoutHistory.ts'
import { compararConAntes } from './workoutSet.ts'

/** Desde este % de series peor, la sesión va peor (como el entrenador). */
const PEOR_DESDE = 0.1
/** Con menos series comparadas, la sesión no se lee. */
const MIN_SERIES = 3

export type Rendimiento = {
  /** Sesiones de los últimos 10 días que van peor, y cuántas se pudieron comparar. */
  peoresRecientes: number
  recientes: number
  /** Lo mismo de los 18 días de antes (del día 11 al 28). */
  peoresAntes: number
  antes: number
}

/** Cada sesión comparable, de la más antigua a la más reciente: su fecha y si fue peor. */
function sesiones(entrenos: readonly Entreno[]): { fecha: string; peor: boolean }[] {
  const orden = [...entrenos].sort((a, b) => a.inicio - b.inicio)
  return orden.flatMap((x, k) => {
    let comparables = 0
    let peores = 0
    for (const e of x.ejercicios) {
      const antes = orden
        .slice(0, k)
        .reverse()
        .map((y) => y.ejercicios.find((z) => z.nombre === e.nombre))
        .find((z) => z?.series.length)
      if (!antes) continue
      e.series.forEach((s, j) => {
        const c = compararConAntes(s, antes.series[j] ?? null)
        if (c === null) return
        comparables++
        if (c === -1) peores++
      })
    }
    return comparables >= MIN_SERIES ? [{ fecha: x.fecha, peor: peores / comparables >= PEOR_DESDE }] : []
  })
}

/** Tu rendimiento de los últimos 10 días frente a las semanas de antes. */
export function rendimientoReciente(entrenos: readonly Entreno[], hoy: string): Rendimiento {
  const corte = addDays(hoy, -9)
  const desde = addDays(hoy, -27)
  const todas = sesiones(entrenos).filter((s) => s.fecha >= desde && s.fecha <= hoy)
  const recientes = todas.filter((s) => s.fecha >= corte)
  const antes = todas.filter((s) => s.fecha < corte)
  return {
    peoresRecientes: recientes.filter((s) => s.peor).length,
    recientes: recientes.length,
    peoresAntes: antes.filter((s) => s.peor).length,
    antes: antes.length,
  }
}
