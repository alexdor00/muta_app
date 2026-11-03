// Lo que enseña la ficha de un ejercicio: tu plan y tus entrenos.
import { formatDecimal } from '../../../shared/lib/format.ts'
import type { LibraryExercise } from '../domain/exerciseLibrary.ts'
import { progresoDe } from '../domain/exerciseProgress.ts'
import { suggestFor } from '../domain/progression.ts'
import { historialDe, ultimaVez } from '../domain/workoutHistory.ts'
import { rangoDe, sugerenciaDe } from '../domain/workoutPlan.ts'
import { entrenos, enTuPlan } from './plan.ts'

/**
 * La ficha de un ejercicio de la biblioteca: si está en tu plan, con la pauta de su sesión, lo que toca hoy (lo mismo
 * que propone la sesión: doble progresión desde la última vez) y su historial; si no, con lo de la biblioteca y
 * «Primera vez».
 */
export function fichaDe(ex: LibraryExercise) {
  const plan = enTuPlan(ex.name)
  const ultima = ultimaVez(entrenos.value, ex.name)
  const rango = (plan && rangoDe(plan.e.reps)) ?? ex.reps
  const rir = plan ? plan.e.rir : ex.rir
  const pesoCorporal = ex.equipment === 'bodyweight' || Boolean(plan?.e.pesoCorporal)
  const sugerencia = plan
    ? sugerenciaDe(plan.e)
    : suggestFor({
        ultima: ultima.length ? ultima.map((s) => ({ ...s, rir: null })) : null,
        rango,
        rir,
        salto: ex.stepKg,
        pesoCorporal,
      })
  const antes = ultima[0] ?? null
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
    progreso: progresoDe(historialDe(entrenos.value, ex.name), rir),
  }
}
