/**
 * El esfuerzo de una serie, siempre en RIR (repeticiones en reserva al acabar la serie). Decisión 2026-11-08: nada de «al
 * fallo» ni «a N del fallo», porque RIR 0 no es fallo (docs/conocimiento/04-guia-culturismo-natural.md §3): RIR 0 es hacer
 * todas las que salen; fallo es intentar otra y que no salga.
 */
export function effortLabel(rir: number): string {
  return `RIR ${Math.max(0, rir)}`
}

/**
 * Un texto del contenido con el esfuerzo escrito igual en todas partes: «0–3 RIR» → «RIR 0–3». Lo demás no cambia
 * («cerca del fallo» habla del fallo de verdad).
 */
export function plainEffort(text: string): string {
  return text.replace(/\b(\d+(?:–\d+)?) RIR\b/g, 'RIR $1')
}

/**
 * El RIR de cada serie con el esfuerzo progresivo de la guía de culturismo natural (§3): las primeras series con uno de
 * margen más y las últimas al RIR de la rutina; cada semana del bloque (`semana`, desde 0) una serie más llega a él. Así
 * se acumula volumen efectivo sin reventarse en la primera serie. Sugerido: la rutina sigue mandando en su RIR objetivo.
 */
export function rirProgresivo(rir: number, series: number, semana = 0): number[] {
  const alObjetivo = Math.min(series, Math.max(1, semana + 1))
  return Array.from({ length: series }, (_, j) => (j >= series - alObjetivo ? rir : Math.min(5, rir + 1)))
}

/** En la casilla del RIR, «F» es fallo de verdad: intentaste otra repetición y no salió (RIR 0 no es fallo). */
export const FALLO = 'F'

/** Lo escrito en la casilla del RIR como se guarda: «2» → RIR 2; «F» → fallo (RIR 0); vacío o raro → nada. */
export function esfuerzoApuntado(texto: string): { rir?: number; fallo?: true } {
  if (texto === FALLO) return { rir: 0, fallo: true }
  const n = Number.parseInt(texto, 10)
  return Number.isInteger(n) && n >= 0 && n <= 9 ? { rir: n } : {}
}
