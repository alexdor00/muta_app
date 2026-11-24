// El descanso de cada ejercicio, revisado al terminar la sesión (usuario, 2026-11-23: «en base a lo que levantes cada
// sesión, que adaptes el descanso»). La regla es la de docs/conocimiento/02-reglas.md § 3, «Ajuste automático tras la
// sesión»; en MUTA no es automático (regla 10): se propone en el resumen con «Aplicar». Compara la 1.ª y la 2.ª serie con
// el mismo peso y un RIR parecido:
// - 2.ª con menos del 80 % de las repeticiones de la 1.ª → +45 s (como mucho, el descanso de tu plan + 2 min).
// - 2.ª con el 95 % o más y la sesión duró más que tu tiempo máximo → −15 s (como poco: 150 s los pesados, 120 s los
//   compuestos y 60 s los aislamientos).

/** Una serie hecha: kilos, repeticiones y RIR apuntado. */
type Serie = { kg?: number | null; reps: number; rir?: number }

export type PropuestaDescanso = {
  nombre: string
  de: number
  a: number
  /** Por qué, en una frase. */
  motivo: string
}

export const MAS_DESCANSO = 45
export const MENOS_DESCANSO = 15
/** Lo más que se sube sobre el descanso de tu plan. */
export const TOPE_SOBRE_PLAN = 120
export const MINIMO = { pesado: 150, compuesto: 120, aislamiento: 60 } as const
/** Pesado: un rango que llega como mucho a 6 repeticiones (sugerido: el documento no lo define). */
export const PESADO_HASTA = 6

export function descansoTrasSesion(d: {
  nombre: string
  series: readonly Serie[]
  /** El descanso que llevas ahora (el tuyo o el del plan) y el del plan, en segundos. */
  descanso: number
  descansoPlan: number
  compuesto: boolean
  /** El máximo de repeticiones de su rango (para saber si es pesado); null sin rango. */
  repsMax: number | null
  /** La sesión duró más que tu tiempo máximo. */
  larga: boolean
}): PropuestaDescanso | null {
  const [s1, s2] = d.series
  if (!s1 || !s2 || s1.reps <= 0) return null
  // Mismo peso y RIR parecido (a ±1, o sin apuntar en las dos): si no, las series no se comparan
  if ((s1.kg ?? 0) !== (s2.kg ?? 0)) return null
  const rirParecido =
    s1.rir === undefined || s2.rir === undefined ? s1.rir === s2.rir : Math.abs(s1.rir - s2.rir) <= 1
  if (!rirParecido) return null
  const parte = s2.reps / s1.reps
  if (parte < 0.8) {
    const a = Math.min(d.descanso + MAS_DESCANSO, d.descansoPlan + TOPE_SOBRE_PLAN)
    return a > d.descanso
      ? {
          nombre: d.nombre,
          de: d.descanso,
          a,
          motivo: `Bajaste de ${s1.reps} a ${s2.reps} repeticiones en la 2.ª serie.`,
        }
      : null
  }
  if (parte >= 0.95 && d.larga) {
    const minimo =
      d.repsMax !== null && d.repsMax <= PESADO_HASTA
        ? MINIMO.pesado
        : d.compuesto
          ? MINIMO.compuesto
          : MINIMO.aislamiento
    const a = Math.max(d.descanso - MENOS_DESCANSO, minimo)
    return a < d.descanso
      ? { nombre: d.nombre, de: d.descanso, a, motivo: 'Mantuviste las repeticiones y la sesión se alargó.' }
      : null
  }
  return null
}
