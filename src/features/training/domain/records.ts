// Récords (usuario, 2026-11-20): tu mejor 1RM estimado de siempre en un ejercicio (sin peso, tus repeticiones máximas).
// Mejorar la vez anterior es una mejora (verde); superar tu mejor marca de siempre es un récord (naranja, solo ese día).
import { e1rm } from './e1rm.ts'
import { mejorDe } from './mesocycles.ts'
import type { Entreno } from './workoutHistory.ts'
import type { SerieHecha } from './workoutSet.ts'

/** Más de un 1 % por encima, como «Récord» en Progreso (`ejercicioEnMes`): así un redondeo no da un récord. */
const MARGEN = 1.01

const fuerza = (s: SerieHecha) => e1rm(s.kg, s.reps, 0)

/** Tu mejor 1RM estimado de siempre en un ejercicio, en los entrenos que se le pasan; 0 si nunca lo has hecho. */
export function mejorDeSiempre(entrenos: readonly Entreno[], nombre: string): number {
  let mejor = 0
  for (const x of entrenos)
    for (const e of x.ejercicios) if (e.nombre === nombre) mejor = Math.max(mejor, mejorDe(e).valor)
  return mejor
}

/**
 * La serie que es récord entre las de hoy: la mejor de hoy si supera tu mejor de siempre (`antes`, de los entrenos
 * anteriores). La primera vez no hay récord: no había con qué compararla. Devuelve su posición o −1.
 */
export function serieRecord(hoy: readonly (SerieHecha | null)[], antes: number): number {
  if (!(antes > 0)) return -1
  let mejor = -1
  hoy.forEach((s, j) => {
    if (s && s.reps > 0 && (mejor < 0 || fuerza(s) > fuerza(hoy[mejor] as SerieHecha))) mejor = j
  })
  return mejor >= 0 && fuerza(hoy[mejor] as SerieHecha) > antes * MARGEN ? mejor : -1
}

export type RecordDelDia = { nombre: string; serie: SerieHecha; e1rm: number }

/** Los récords de un entreno frente a todos los anteriores a él: cada ejercicio con su mejor serie y su 1RM. */
export function recordsDelEntreno(entreno: Entreno, entrenos: readonly Entreno[]): RecordDelDia[] {
  const anteriores = entrenos.filter((x) => x.id !== entreno.id && x.inicio < entreno.inicio)
  const out: RecordDelDia[] = []
  for (const e of entreno.ejercicios) {
    const j = serieRecord(e.series, mejorDeSiempre(anteriores, e.nombre))
    if (j >= 0)
      out.push({ nombre: e.nombre, serie: e.series[j], e1rm: Math.round(fuerza(e.series[j]) * 10) / 10 })
  }
  return out
}

/** Los récords de un día (de todos sus entrenos), frente a todo lo de antes. */
export function recordsDelDia(fecha: string, entrenos: readonly Entreno[]): RecordDelDia[] {
  return entrenos.filter((x) => x.fecha === fecha).flatMap((x) => recordsDelEntreno(x, entrenos))
}
