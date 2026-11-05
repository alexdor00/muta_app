// Tu peso: tendencia y ritmo semanal. Reglas de docs/conocimiento/02-reglas.md · sección 8 («Tendencia y ritmo»).
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import { KCAL_POR_KG } from './targets.ts'

export type Pesaje = { date: string; kg: number }
export type PuntoPeso = Pesaje & { tendencia: number }

/** Cuánto mueve cada pesaje la tendencia (media que suaviza el agua del día a día). */
const SUAVIZADO = 0.15

/** Tendencia = anterior + 0,15 × (peso de hoy − anterior); la primera, el primer pesaje. Por fecha. */
export function tendencia(pesajes: readonly Pesaje[]): PuntoPeso[] {
  let t: number | null = null
  return [...pesajes]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => {
      t = t === null ? p.kg : t + SUAVIZADO * (p.kg - t)
      return { ...p, tendencia: Math.round(t * 100) / 100 }
    })
}

/** Los pesajes de los últimos `dias` días (hoy incluido). */
export function deLosUltimos<T extends { date: string }>(
  lista: readonly T[],
  hoy: string,
  dias: number,
): T[] {
  const desde = addDays(hoy, -(dias - 1))
  return lista.filter((p) => p.date >= desde && p.date <= hoy)
}

export type Ritmo = { kgSemana: number; pctSemana: number; tendencia: number }

/**
 * Ritmo semanal: regresión lineal de la tendencia de los últimos 14 días, en kg y en % del peso por semana.
 * Necesita al menos 4 pesajes repartidos en 6 días o más; si no, null.
 */
export function ritmoSemanal(serie: readonly PuntoPeso[], hoy: string, dias = 14): Ritmo | null {
  const puntos = deLosUltimos(serie, hoy, dias)
  if (puntos.length < 4) return null
  if (daysBetween(puntos[0].date, puntos[puntos.length - 1].date) < 6) return null
  const xs = puntos.map((p) => daysBetween(puntos[0].date, p.date))
  const ys = puntos.map((p) => p.tendencia)
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length
  const my = ys.reduce((s, y) => s + y, 0) / ys.length
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  const porDia = num / den
  const ultima = ys[ys.length - 1]
  return {
    kgSemana: Math.round(porDia * 7 * 100) / 100,
    pctSemana: Math.round(((porDia * 7) / ultima) * 10000) / 100,
    tendencia: ultima,
  }
}

/**
 * Gasto medido: lo que comes de media menos lo que se mueve el peso (7.700 kcal por kilo), entre basal × 1,1 y × 2,6.
 * Solo con 8 pesajes y 8 días de comida en los últimos 14; si no, null.
 */
export function gastoMedido(datos: {
  serie: readonly PuntoPeso[]
  dias: readonly { date: string; kcal: number }[]
  hoy: string
  basal: number
}): number | null {
  const pesajes = deLosUltimos(datos.serie, datos.hoy, 14)
  const comidos = deLosUltimos(datos.dias, datos.hoy, 14).filter((d) => d.kcal > 0)
  if (pesajes.length < 8 || comidos.length < 8) return null
  const ritmo = ritmoSemanal(datos.serie, datos.hoy)
  if (!ritmo) return null
  const media = comidos.reduce((s, d) => s + d.kcal, 0) / comidos.length
  const observado = media - (ritmo.kgSemana / 7) * KCAL_POR_KG
  return Math.round(Math.min(datos.basal * 2.6, Math.max(datos.basal * 1.1, observado)))
}
