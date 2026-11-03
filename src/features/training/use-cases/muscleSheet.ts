import muscles from '../../../shared/content/tips/muscles.json'
import type { HuecoPlan } from '../domain/muscleInPlan.ts'
import type { MuscleId } from '../domain/muscles.ts'
import { porNombre } from './exerciseLibrary.ts'

type Consejo = { text: string; why: string; source: string }
/** Lo de un músculo en el prototipo anterior (scripts/tips-from-prototype.cjs): la clave, sus consejos y dónde ponerlo. */
type ConsejosMusculo = { key: string; tips: Consejo[]; where: string | null }

const MUSCULOS = muscles as Record<string, ConsejosMusculo>

/** La pestaña Consejos de un músculo, o null si no hay nada suyo. */
export function consejosDeMusculo(m: MuscleId): ConsejosMusculo | null {
  return MUSCULOS[m] ?? null
}

/**
 * Los ejercicios de las sesiones de la semana con lo que aporta cada uno a cada músculo: de la biblioteca, por su nombre;
 * si no está en ella, 1 a su músculo principal (si se sabe); si tampoco, no cuenta.
 */
export function huecosDelPlan(
  sesiones: readonly {
    sigla: string
    ejercicios: readonly { nombre: string; series: number; musculo?: MuscleId | null }[]
  }[],
): HuecoPlan[] {
  return sesiones.flatMap((s) =>
    s.ejercicios.flatMap((e): HuecoPlan[] => {
      const lib = porNombre(e.nombre)
      const base = { sigla: s.sigla, nombre: e.nombre, series: e.series }
      if (lib) return [{ ...base, id: lib.id, contributes: lib.contributes }]
      return e.musculo ? [{ ...base, id: null, contributes: { [e.musculo]: 1 } }] : []
    }),
  )
}
