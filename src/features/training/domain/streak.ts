// Racha de días (tarjeta final): cuentan los días que entrenas y los de descanso que deja tu plan; la rompe descansar
// más días de los que deja en una semana (decisiones 2026-11-02: el descanso también cuenta; 2026-11-03: la sesión va
// por rotación, sin días fijos, así que se cuentan los descansos de cada semana, no qué día caen).

const DIA = 86_400_000

/** El lunes de la semana de un día (ms UTC). */
function lunesDe(t: number): number {
  return t - ((new Date(t).getUTCDay() + 6) % 7) * DIA
}

/**
 * Días seguidos, hasta `hoy` incluido, que cuentan para la racha: los entrenados y, en cada semana de lunes a domingo,
 * hasta `descansosPorSemana` días sin entrenar (7 menos las sesiones de tu semana). Hoy, si aún no has entrenado, no
 * la rompe: cuenta desde ayer. Antes del primer entreno no hay racha.
 */
export function diasDeRacha(fechas: readonly string[], descansosPorSemana: number, hoy: string): number {
  if (!fechas.length) return 0
  const entrenados = new Set(fechas.map((f) => Date.parse(`${f}T00:00:00Z`)))
  const primero = Math.min(...entrenados)
  let dia = Date.parse(`${hoy}T00:00:00Z`)
  if (!entrenados.has(dia)) dia -= DIA
  const descansos = new Map<number, number>()
  let racha = 0
  while (dia >= primero) {
    if (!entrenados.has(dia)) {
      const semana = lunesDe(dia)
      const usados = (descansos.get(semana) ?? 0) + 1
      if (usados > descansosPorSemana) break
      descansos.set(semana, usados)
    }
    racha++
    dia -= DIA
  }
  return racha
}
