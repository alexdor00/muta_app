// Los días de la semana en Comida. El resumen de la semana (medias, proteína por días, tendencia) no va en Comida: será de
// Progreso (decisión 2026-11-05).

/** La letra del día de la semana: «L», «M», «X»… */
export function letraDia(iso: string): string {
  return ['D', 'L', 'M', 'X', 'J', 'V', 'S'][new Date(`${iso}T00:00:00Z`).getUTCDay()]
}
