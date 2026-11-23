// La recarga de hidratos en definición (decisión del usuario, 2026-11-09; guía G1 §7): se propone, nunca se aplica sola.
// - Cuándo: desde la semana 8 de la definición (la segunda mitad), si tu rendimiento baja en varias sesiones recientes
//   (2 o más en 10 días) cuando antes venías estable o mejorando; como mucho una cada 3 semanas.
// - Cuánto dura: una vuelta completa de tu rutina (hasta entrenar todo el cuerpo una vez).
// - Qué comes: lo de mantenimiento, con todo lo de más en hidratos (como las pausas de dieta de los documentos).
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import type { Fase } from './targets.ts'

export const SEMANA_RECARGA = 8
export const DIAS_ENTRE_RECARGAS = 21
/** Como mucho, aunque la vuelta de tu rutina sea más larga. */
const DIAS_MAX = 14

/** Tu rendimiento sesión a sesión (lo da Entreno): las que van peor en los últimos 10 días y en las semanas de antes. */
export type RendimientoReciente = {
  peoresRecientes: number
  recientes: number
  peoresAntes: number
  antes: number
}

/**
 * Una recarga: desde cuándo y hasta cuándo. Con `sesiones` (usuario, 2026-11-22), acaba cuando has hecho de verdad esas
 * sesiones de tu rutina (los días que no entrenas no cuentan; como mucho 14 días) y solo sube los días que entrenas.
 */
export type Recarga = { desde: string; hasta: string; sesiones?: number }

/** Tu rendimiento baja en varias sesiones recientes cuando antes venías estable o mejorando. */
export function rendimientoCae(r: RendimientoReciente | null): boolean {
  return !!r && r.peoresRecientes >= 2 && r.antes >= 2 && r.peoresAntes / r.antes <= 0.25
}

/** Si toca proponer la recarga hoy. */
export function tocaRecarga(d: {
  fase: Fase
  semanaFase: number
  rendimiento: RendimientoReciente | null
  ultima: Recarga | null
  hoy: string
  /** Semanas seguidas con señales (hambre, sueño, energía, estrés; usuario, 2026-11-22: también por cómo estás). */
  semanasConSenales?: number
}): boolean {
  const porTi = (d.semanasConSenales ?? 0) >= 2
  if (d.fase !== 'definicion' || d.semanaFase < SEMANA_RECARGA || !(rendimientoCae(d.rendimiento) || porTi))
    return false
  return !d.ultima || daysBetween(d.ultima.hasta, d.hoy) >= DIAS_ENTRE_RECARGAS
}

/** Hasta cuándo dura: los días que tardas en hacer `sesiones` entrenos desde `desde` (como mucho 14). */
export function finDeRecarga(desde: string, sesiones: number, esEntreno: (fecha: string) => boolean): string {
  let hechas = 0
  for (let k = 0; k < DIAS_MAX; k++) {
    const fecha = addDays(desde, k)
    if (esEntreno(fecha)) hechas++
    if (hechas >= Math.max(1, sesiones)) return fecha
  }
  return addDays(desde, DIAS_MAX - 1)
}

/** Si una fecha cae dentro de la recarga. */
export const enRecarga = (r: Recarga | null | undefined, fecha: string) =>
  !!r && fecha >= r.desde && fecha <= r.hasta

/** La recarga con su fin de verdad: con sus sesiones, cuando las has hecho (lo pasado, lo que entrenaste; lo que viene, tu rutina). */
export function recargaEfectiva(
  r: Recarga | null | undefined,
  esEntreno: (fecha: string) => boolean,
): Recarga | null {
  if (!r) return null
  return r.sesiones ? { ...r, hasta: finDeRecarga(r.desde, r.sesiones, esEntreno) } : r
}
