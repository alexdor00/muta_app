// Tu fuerza con el tiempo (Progreso: tu etapa y desde que empezaste): tus básicos —los compuestos que más repites—, cuánto
// cambia su mejor 1RM estimado en un tramo y la línea de semana a semana. El 1RM, el de `mejorDe` (sin RIR), como los récords.
import { mejorDe } from './mesocycles.ts'
import { lunesDe } from './trainingProgress.ts'
import type { MuscleId } from './muscles.ts'
import type { Entreno } from './workoutHistory.ts'
import type { SerieHecha } from './workoutSet.ts'

/** Cuántos básicos cuentan (los mismos 3 de la fuerza de la consulta semanal). */
export const BASICOS = 3

/** Tus básicos: los compuestos que más veces has hecho, de más a menos. */
export function basicosDe(
  entrenos: readonly Entreno[],
  esCompuesto: (nombre: string) => boolean,
  n = BASICOS,
): string[] {
  const veces = new Map<string, number>()
  for (const x of entrenos)
    for (const e of x.ejercicios)
      if (esCompuesto(e.nombre) && mejorDe(e).valor) veces.set(e.nombre, (veces.get(e.nombre) ?? 0) + 1)
  return [...veces.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([nombre]) => nombre)
}

/** El mejor 1RM estimado de un ejercicio cada semana (lunes → valor), dentro de un tramo. */
function porSemana(entrenos: readonly Entreno[], nombre: string, desde: string | null, hasta: string | null) {
  const out = new Map<string, number>()
  for (const x of entrenos) {
    if ((desde && x.fecha < desde) || (hasta && x.fecha > hasta)) continue
    for (const e of x.ejercicios) {
      if (e.nombre !== nombre) continue
      const { valor } = mejorDe(e)
      const lunes = lunesDe(x.fecha)
      if (valor > (out.get(lunes) ?? 0)) out.set(lunes, valor)
    }
  }
  return [...out.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export type BasicoEnTramo = { nombre: string; de: number; a: number; cambio: number }

/**
 * Tus básicos en un tramo (sin `desde` o `hasta`: sin límite): su mejor 1RM de la primera semana que lo hiciste y de la
 * última, y el cambio medio de todos. null si ninguno se hizo en dos semanas distintas.
 */
export function fuerzaEnTramo(
  entrenos: readonly Entreno[],
  basicos: readonly string[],
  desde: string | null,
  hasta: string | null,
): { cambio: number; basicos: BasicoEnTramo[] } | null {
  const lista = basicos.flatMap((nombre) => {
    const s = porSemana(entrenos, nombre, desde, hasta)
    const [primera, ultima] = [s[0], s.at(-1)]
    if (!primera || !ultima || s.length < 2) return []
    const [de, a] = [Math.round(primera[1] * 10) / 10, Math.round(ultima[1] * 10) / 10]
    return [{ nombre, de, a, cambio: Math.round((ultima[1] / primera[1] - 1) * 1000) / 1000 }]
  })
  if (!lista.length) return null
  const cambio = lista.reduce((t, b) => t + b.cambio, 0) / lista.length
  return { cambio: Math.round(cambio * 1000) / 1000, basicos: lista }
}

/**
 * Tu fuerza semana a semana: el cambio medio de tus básicos frente a su primera semana (0 = como al empezar). La semana que
 * no hiciste uno, cuenta su última; antes de hacerlo por primera vez, no cuenta.
 */
export function fuerzaPorSemana(
  entrenos: readonly Entreno[],
  basicos: readonly string[],
): { lunes: string; cambio: number }[] {
  const series = basicos.map((nombre) => new Map(porSemana(entrenos, nombre, null, null)))
  const semanas = [...new Set(series.flatMap((s) => [...s.keys()]))].sort()
  const primeros = series.map((s) => [...s.values()][0] ?? 0)
  const ultimos: (number | null)[] = basicos.map(() => null)
  return semanas.map((lunes) => {
    series.forEach((s, i) => {
      const v = s.get(lunes)
      if (v) ultimos[i] = v
    })
    const cambios = ultimos.flatMap((v, i) => (v && primeros[i] ? [v / primeros[i] - 1] : []))
    const cambio = cambios.reduce((t, c) => t + c, 0) / Math.max(1, cambios.length)
    return { lunes, cambio: Math.round(cambio * 1000) / 1000 }
  })
}

/** Un ejercicio con tiempo: su músculo y su mejor 1RM estimado de cada día que lo hiciste (del primero al último). */
export type EjercicioEnElTiempo = {
  nombre: string
  musculo: MuscleId | null
  /** Cada día, su mejor 1RM estimado y la serie que lo dio. */
  puntos: { fecha: string; e1rm: number; serie: SerieHecha }[]
}

/** Cada ejercicio que has hecho con peso, con su mejor 1RM estimado de cada día y su serie (como la ficha del ejercicio). */
export function ejerciciosEnElTiempo(
  entrenos: readonly Entreno[],
  musculoDe: (nombre: string, guardado: MuscleId | null) => MuscleId | null,
): EjercicioEnElTiempo[] {
  const por = new Map<string, EjercicioEnElTiempo>()
  for (const x of [...entrenos].sort((a, b) => a.inicio - b.inicio))
    for (const e of x.ejercicios) {
      const { valor, serie } = mejorDe(e)
      if (!valor || !serie) continue
      const o = por.get(e.nombre) ?? { nombre: e.nombre, musculo: musculoDe(e.nombre, e.musculo), puntos: [] }
      const ultimo = o.puntos.at(-1)
      const v = Math.round(valor * 10) / 10
      if (ultimo?.fecha !== x.fecha) o.puntos.push({ fecha: x.fecha, e1rm: v, serie })
      else if (v > ultimo.e1rm) Object.assign(ultimo, { e1rm: v, serie })
      por.set(e.nombre, o)
    }
  return [...por.values()]
}
