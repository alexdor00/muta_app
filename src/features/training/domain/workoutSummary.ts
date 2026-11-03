// Resumen de una sesión terminada (tarjeta final de la app anterior): récords, cifras y cada ejercicio frente a la
// última vez. Se compara por el 1RM estimado de la mejor serie de cada ejercicio.
import { e1rm } from './e1rm.ts'
import { compararConAntes, type SerieHecha } from './workoutSet.ts'

export type EjercicioHecho = { nombre: string; hechas: SerieHecha[]; antes: SerieHecha[] }

export type ResumenEjercicio = {
  nombre: string
  /** Las series de hoy, con las que mejoran la misma serie de la vez anterior marcadas. */
  series: (SerieHecha & { mejor: boolean })[]
  /** La serie de hoy con más 1RM estimado, y la de la vez anterior. */
  mejor: SerieHecha
  mejorAntes: SerieHecha | null
  /** Cuánto cambió ese 1RM, en tanto por uno (null sin vez anterior). */
  cambio: number | null
}

const fuerza = (s: SerieHecha) => e1rm(s.kg, s.reps, 0)
const mejorDe = (series: SerieHecha[]) =>
  series.reduce<SerieHecha | null>((m, s) => (!m || fuerza(s) > fuerza(m) ? s : m), null)

/**
 * Por cada ejercicio hecho, su mejor serie frente a la mejor de la vez anterior; los récords (los que mejoran), cuántos
 * suben, la mejor serie de la sesión, el volumen (kg × reps), las series y repeticiones, y cuántas series superaron la
 * misma serie de la vez anterior (de cuántas había con qué comparar).
 */
export function resumenSesion(ejercicios: readonly EjercicioHecho[]) {
  const porEjercicio: ResumenEjercicio[] = []
  let volumen = 0
  let series = 0
  let reps = 0
  let superadas = 0
  let comparables = 0
  for (const e of ejercicios) {
    const mejor = mejorDe(e.hechas)
    if (!mejor) continue
    for (const s of e.hechas) {
      volumen += (s.kg ?? 0) * s.reps
      reps += s.reps
      series++
    }
    const mejorAntes = mejorDe(e.antes)
    const cambio = mejorAntes && fuerza(mejorAntes) > 0 ? fuerza(mejor) / fuerza(mejorAntes) - 1 : null
    const conMarca = e.hechas.map((s, j) => {
      const c = compararConAntes(s, e.antes[j] ?? null)
      if (c !== null) comparables++
      if (c === 1) superadas++
      return { ...s, mejor: c === 1 }
    })
    porEjercicio.push({ nombre: e.nombre, series: conMarca, mejor, mejorAntes, cambio })
  }
  const mejorDeTodas = porEjercicio.reduce<ResumenEjercicio | null>(
    (m, e) => (!m || fuerza(e.mejor) > fuerza(m.mejor) ? e : m),
    null,
  )
  // Mejora por encima de medio punto, como en las series récord
  const records = porEjercicio.filter((e) => (e.cambio ?? 0) > 0.005)
  return {
    ejercicios: porEjercicio,
    records,
    suben: records.length,
    comparados: porEjercicio.filter((e) => e.cambio !== null).length,
    mejorSerie: mejorDeTodas ? { nombre: mejorDeTodas.nombre, serie: mejorDeTodas.mejor } : null,
    volumen,
    series,
    reps,
    superadas,
    comparables,
  }
}
