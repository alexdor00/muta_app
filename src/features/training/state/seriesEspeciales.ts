// Lo especial de algunas series en la sesión: la superserie (se alternan dos ejercicios) y las bajadas (dropset) o
// mini-series (rest-pause) dentro de una serie.
import { parseDecimal } from '../../../shared/lib/format.ts'
import { superseries } from '../domain/routineEdit.ts'
import { mismoPeso, type EjercicioPlan } from '../domain/workoutPlan.ts'
import {
  terminado,
  type EjercicioEnCurso,
  type ExtraEnCurso,
  type SerieEnCurso,
  type SesionEnCurso,
} from './sesionEnCurso.ts'

/** Entre los ejercicios de una superserie se pasa al otro tras 20 s (docs/conocimiento/02-reglas.md). */
export const DESCANSO_SUPERSERIE = 20

/**
 * Tras una serie de un ejercicio en superserie: a cuál se pasa y si con el descanso corto (20 s, al siguiente del grupo) o
 * con el normal (al primero, tras el último). null si va solo, si es un añadido de hoy o si el otro ya está terminado.
 */
export function siguienteEnSuperserie(
  en: SesionEnCurso,
  ej: number,
): { siguiente: number; corto: boolean } | null {
  const grupo = ej < en.base.length ? superseries(en.base)[ej] : null
  if (!grupo) return null
  const pos = grupo.indexOf(ej)
  const siguiente = pos < grupo.length - 1 ? grupo[pos + 1] : grupo[0]
  if (terminado(en.ejercicios[siguiente])) return null
  return { siguiente, corto: pos < grupo.length - 1 }
}

/** ¿Va en superserie? (para la pastilla de la pauta). */
export const enSuperserie = (en: SesionEnCurso, ej: number) =>
  ej < en.base.length && superseries(en.base)[ej] !== null

/** Añade una bajada o mini-serie vacía al final de la serie `j`. */
export const anadirExtra = (x: EjercicioEnCurso, j: number): EjercicioEnCurso => ({
  ...x,
  series: x.series.map((s, k) => (k === j ? { ...s, extra: [...(s.extra ?? []), { kg: '', reps: '' }] } : s)),
})

/** Escribe en la bajada o mini-serie `n` de la serie `j` (la primera puede ser la fila vacía, aún sin guardar). */
export const cambiarExtra = (
  x: EjercicioEnCurso,
  j: number,
  n: number,
  campo: keyof ExtraEnCurso,
  valor: string,
): EjercicioEnCurso => ({
  ...x,
  series: x.series.map((s, k) =>
    k === j
      ? {
          ...s,
          extra: Array.from({ length: Math.max(n + 1, s.extra?.length ?? 0) }, (_, m) => {
            const y = s.extra?.[m] ?? { kg: '', reps: '' }
            return m === n ? { ...y, [campo]: valor } : y
          }),
        }
      : s,
  ),
})

/** Quita la bajada o mini-serie `n` de la serie `j`. */
export const quitarExtra = (x: EjercicioEnCurso, j: number, n: number): EjercicioEnCurso => ({
  ...x,
  series: x.series.map((s, k) => (k === j ? { ...s, extra: (s.extra ?? []).filter((_, m) => m !== n) } : s)),
})

/** Lo hecho de las filas de más de una serie: las que tienen repeticiones (sin peso y no es un dropset, el de la serie). */
export function extrasHechos(e: EjercicioPlan, s: SerieEnCurso): { kg: number | null; reps: number }[] {
  return (s.extra ?? []).flatMap((y) => {
    const reps = parseDecimal(y.reps)
    if (!reps) return []
    const kg = parseDecimal(y.kg) ?? (mismoPeso(e.tecnica) ? parseDecimal(s.kg) : null)
    return [{ kg, reps }]
  })
}
