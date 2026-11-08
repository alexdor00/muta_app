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
