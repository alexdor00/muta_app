// Lo que enseña la ficha de un ejercicio con los DATOS DE PRUEBA (se borra con el resto de state/muestra/).
import { formatDecimal } from '../../../../shared/lib/format.ts'
import type { LibraryExercise } from '../../domain/exerciseLibrary.ts'
import { progresoDe } from '../../domain/exerciseProgress.ts'
import { suggestFor } from '../../domain/progression.ts'
import { anteriores } from './datos.ts'
import { enTuPlan, historialEjercicio, rangoDe, sugerenciaDe } from './ejercicios.ts'

/**
 * La ficha de un ejercicio de la biblioteca: si está en tu plan, con la pauta de su sesión, lo que toca hoy (lo mismo
 * que propone la sesión: doble progresión desde la última vez) y su historial; si no, con lo de la biblioteca y
 * «Primera vez».
 */
export function fichaMuestra(ex: LibraryExercise) {
  const plan = enTuPlan(ex.name)
  const rango = (plan && rangoDe(plan.e.reps)) ?? ex.reps
  const rir = plan ? plan.e.rir : ex.rir
  const pesoCorporal = ex.equipment === 'bodyweight' || Boolean(plan?.e.pesoCorporal)
  const sugerencia = plan
    ? sugerenciaDe(plan.e)
    : suggestFor({ ultima: null, rango, rir, salto: ex.stepKg, pesoCorporal })
  const antes = plan ? anteriores(plan.e)[0] : null
  // Como en el prototipo: «+1 rep» si con el mismo peso toca una rep más que la última vez
  const etiqueta = {
    sube: '↑ Sube',
    baja: '↓ Baja',
    igual: antes && Number(sugerencia.reps) > antes.reps ? '+1 rep' : 'Mantén',
    estimado: 'Estimado',
    nuevo: 'Nuevo',
  }[sugerencia.tendencia]
  return {
    plan,
    rango,
    rir,
    pesoCorporal,
    sugerencia: {
      ...sugerencia,
      etiqueta,
      valor:
        sugerencia.kg != null
          ? `${formatDecimal(sugerencia.kg)} kg × ${sugerencia.reps}`
          : `${sugerencia.reps} reps`,
    },
    progreso: plan ? progresoDe(historialEjercicio(plan.e), rir) : [],
  }
}
