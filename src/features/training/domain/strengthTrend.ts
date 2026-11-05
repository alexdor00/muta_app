// Fuerza en los básicos, para la consulta semanal de Comida (docs/conocimiento/02-reglas.md · sección 8): los 3 ejercicios
// compuestos que más repites, su mejor 1RM estimado de las 2 últimas semanas frente al de las 2 anteriores.
import { addDays } from '../../../shared/lib/format.ts'
import { e1rm } from './e1rm.ts'
import type { Entreno } from './workoutHistory.ts'

export type FuerzaBasicos = {
  /** Cambio medio de los básicos: −0,03 es un 3 % menos. */
  cambio: number
  ejercicios: { nombre: string; antes: number; ahora: number }[]
}

/** Mejor 1RM estimado de un ejercicio entre dos fechas (incluidas); 0 si no se hizo. */
function mejor(entrenos: readonly Entreno[], nombre: string, desde: string, hasta: string): number {
  let max = 0
  for (const x of entrenos) {
    if (x.fecha < desde || x.fecha > hasta) continue
    for (const e of x.ejercicios)
      if (e.nombre === nombre) for (const s of e.series) max = Math.max(max, e1rm(s.kg, s.reps, 0))
  }
  return max
}

/**
 * La fuerza en tus básicos: null si no hay al menos uno de los 3 con series en los dos tramos. `esCompuesto` dice si un
 * ejercicio es compuesto (la biblioteca lo sabe).
 */
export function fuerzaEnBasicos(
  entrenos: readonly Entreno[],
  hoy: string,
  esCompuesto: (nombre: string) => boolean,
): FuerzaBasicos | null {
  const inicio = addDays(hoy, -27)
  const corte = addDays(hoy, -13)
  const veces = new Map<string, number>()
  for (const x of entrenos)
    if (x.fecha >= inicio && x.fecha <= hoy)
      for (const e of x.ejercicios)
        if (e.series.length && esCompuesto(e.nombre)) veces.set(e.nombre, (veces.get(e.nombre) ?? 0) + 1)
  const basicos = [...veces.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nombre]) => nombre)
  const ejercicios = basicos
    .map((nombre) => ({
      nombre,
      antes: mejor(entrenos, nombre, inicio, addDays(corte, -1)),
      ahora: mejor(entrenos, nombre, corte, hoy),
    }))
    .filter((e) => e.antes > 0 && e.ahora > 0)
  if (!ejercicios.length) return null
  const cambio = ejercicios.reduce((s, e) => s + (e.ahora / e.antes - 1), 0) / ejercicios.length
  return { cambio: Math.round(cambio * 1000) / 1000, ejercicios }
}
