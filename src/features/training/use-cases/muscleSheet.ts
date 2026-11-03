import muscles from '../../../shared/content/tips/muscles.json'
import type { HuecoPlan } from '../domain/muscleInPlan.ts'
import type { MuscleId } from '../domain/muscles.ts'
import { LIBRARY } from './exerciseLibrary.ts'

type Consejo = { text: string; why: string; source: string }
/** Lo de un músculo en el prototipo anterior (scripts/tips-from-prototype.cjs): la clave, sus consejos y dónde ponerlo. */
type ConsejosMusculo = { key: string; tips: Consejo[]; where: string | null }

const MUSCULOS = muscles as Record<string, ConsejosMusculo>

/** La pestaña Consejos de un músculo, o null si no hay nada suyo. */
export function consejosDeMusculo(m: MuscleId): ConsejosMusculo | null {
  return MUSCULOS[m] ?? null
}

/**
 * Los ejercicios de las sesiones de la semana con lo que aporta cada uno a cada músculo (de la biblioteca, por su nombre;
 * los que no están en ella no cuentan).
 */
export function huecosDelPlan(
  sesiones: readonly { sigla: string; ejercicios: readonly { nombre: string; series: number }[] }[],
): HuecoPlan[] {
  return sesiones.flatMap((s) =>
    s.ejercicios.flatMap((e) => {
      const lib = LIBRARY.find((l) => l.name === e.nombre)
      return lib
        ? [{ id: lib.id, sigla: s.sigla, nombre: e.nombre, series: e.series, contributes: lib.contributes }]
        : []
    }),
  )
}
