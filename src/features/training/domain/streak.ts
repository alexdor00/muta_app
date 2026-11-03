// Racha de días (tarjeta final): cuentan los días que entrenas y los de descanso de tu plan; la rompe un día de
// entreno sin entrenar (decisión 2026-11-02: el descanso también cuenta).

const DIA = 86_400_000

/** Día de la semana de una fecha AAAA-MM-DD: lunes = 0 … domingo = 6. */
function diaSemana(t: number): number {
  return (new Date(t).getUTCDay() + 6) % 7
}

/**
 * Días seguidos, hasta `hoy` incluido, que cuentan para la racha: los entrenados y los de descanso del plan
 * (`descansos`: días de la semana, lunes = 0). Hoy, si toca entrenar y aún no lo has hecho, no la rompe: cuenta
 * desde ayer. Antes del primer entreno no hay racha.
 */
export function diasDeRacha(fechas: readonly string[], descansos: readonly number[], hoy: string): number {
  if (!fechas.length) return 0
  const entrenados = new Set(fechas.map((f) => Date.parse(`${f}T00:00:00Z`)))
  const primero = Math.min(...entrenados)
  const cuenta = (t: number) => entrenados.has(t) || descansos.includes(diaSemana(t))
  let dia = Date.parse(`${hoy}T00:00:00Z`)
  if (!cuenta(dia)) dia -= DIA
  let racha = 0
  while (dia >= primero && cuenta(dia)) {
    racha++
    dia -= DIA
  }
  return racha
}
