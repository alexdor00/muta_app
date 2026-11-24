// El tiempo de la sesión en curso: cuánto llevas sin contar las pausas, pausar, contar desde ahora y el tiempo muerto
// (usuario, 2026-11-23: una sesión dejada a medias sin pausar no cuenta horas). Aparte de sesionEnCurso.ts por tamaño.
import type { SesionEnCurso } from './sesionEnCurso.ts'

/** Más de 30 min sin apuntar ninguna serie (sugerido): ese rato no cuenta como entreno (usuario, 2026-11-23). */
export const HUECO_SIN_APUNTAR = 30 * 60_000

/** El tiempo sin pausa desde la última serie apuntada (o desde que empezaste), en ms. */
function sinApuntar(en: SesionEnCurso, ahora: number): number {
  const u = en.ultimoApunte ?? { en: en.inicio, pausaMs: 0 }
  const fin = en.pausadaEn ?? ahora
  return Math.max(0, fin - u.en - (en.pausaMs - u.pausaMs))
}

/**
 * Al apuntar una serie: si llevabas más de 30 min sin apuntar nada (la dejaste a medias sin pausar), ese rato cuenta como
 * pausa, menos el descanso de ese ejercicio, que sí es entreno.
 */
export function sinTiempoMuerto(en: SesionEnCurso, ahora: number, descansoS: number): SesionEnCurso {
  const muerto = sinApuntar(en, ahora)
  const hueco = muerto > HUECO_SIN_APUNTAR ? muerto - descansoS * 1000 : 0
  const pausaMs = en.pausaMs + Math.max(0, hueco)
  return { ...en, pausaMs, ultimoApunte: { en: ahora, pausaMs }, ...(hueco > 0 ? { conHueco: true } : {}) }
}

/** Al terminar: si llevabas más de 30 min sin apuntar nada, la sesión acabó con tu última serie. */
export function finDeLaSesion(en: SesionEnCurso, ahora: number): number {
  const muerto = sinApuntar(en, ahora)
  return muerto > HUECO_SIN_APUNTAR ? (en.pausadaEn ?? ahora) - muerto : ahora
}

/** Segundos que lleva la sesión, sin contar las pausas. */
export function segundosSesion(en: SesionEnCurso, ahora: number): number {
  // Lo primero de: terminada, en pausa o ahora (terminar estando en pausa no cuenta la pausa: usuario, 2026-11-23)
  const fin = Math.min(en.terminada ?? ahora, en.pausadaEn ?? ahora, ahora)
  return Math.max(0, (fin - en.inicio - en.pausaMs) / 1000)
}

/** Para o vuelve a poner en marcha el tiempo de la sesión. */
export function alternarPausa(en: SesionEnCurso, ahora: number): SesionEnCurso {
  return en.pausadaEn === null
    ? { ...en, pausadaEn: ahora }
    : { ...en, pausadaEn: null, pausaMs: en.pausaMs + (ahora - en.pausadaEn) }
}

/** Vuelve a contar el tiempo desde ahora (si la sesión se empezó sin querer). */
export function contarDesdeAhora(en: SesionEnCurso, ahora: number): SesionEnCurso {
  return { ...en, inicio: ahora, pausaMs: 0, pausadaEn: null }
}
