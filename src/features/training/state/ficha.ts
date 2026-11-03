// Lo que enseña la ficha de un ejercicio: tu plan y tus entrenos.
import { formatDecimal } from '../../../shared/lib/format.ts'
import type { LibraryExercise } from '../domain/exerciseLibrary.ts'
import type { Range } from '../domain/muscles.ts'
import { progresoDe } from '../domain/exerciseProgress.ts'
import { suggestFor, type Sugerencia } from '../domain/progression.ts'
import { historialDe, ultimaVez } from '../domain/workoutHistory.ts'
import { rangoDe, sugerenciaDe } from '../domain/workoutPlan.ts'
import type { SerieHecha } from '../domain/workoutSet.ts'
import { entrenos, enTuPlan } from './plan.ts'

/** Lo que toca hoy, para enseñarlo: «62,5 kg × 6–10» y su etiqueta («↑ Sube», «+1 rep», «Mantén»…). */
function vistaSugerencia(sugerencia: Sugerencia, antes: SerieHecha | null) {
  // Como en el prototipo: «+1 rep» si con el mismo peso toca una rep más que la última vez
  const etiqueta = {
    sube: '↑ Sube',
    baja: '↓ Baja',
    igual: antes && Number(sugerencia.reps) > antes.reps ? '+1 rep' : 'Mantén',
    estimado: 'Estimado',
    nuevo: 'Nuevo',
  }[sugerencia.tendencia]
  const valor =
    sugerencia.kg != null
      ? `${formatDecimal(sugerencia.kg)} kg × ${sugerencia.reps}`
      : `${sugerencia.reps} reps`
  return { ...sugerencia, etiqueta, valor }
}

/**
 * La ficha de un ejercicio de la biblioteca: si está en tu plan, con la pauta de su sesión, lo que toca hoy (lo mismo
 * que propone la sesión: doble progresión desde la última vez) y su historial; si no, con lo que pone tu rutina en otras
 * semanas (`deRutina`) o, si tampoco, lo típico de la biblioteca. `fuente` dice de dónde salen las repeticiones.
 */
export function fichaDe(ex: LibraryExercise, deRutina: { reps: Range; rir: number | null } | null = null) {
  const plan = enTuPlan(ex.name)
  const ultima = ultimaVez(entrenos.value, ex.name)
  const rango = (plan && rangoDe(plan.e.reps)) ?? deRutina?.reps ?? ex.reps
  const rir = plan ? plan.e.rir : (deRutina?.rir ?? ex.rir)
  const fuente: 'plan' | 'rutina' | 'biblioteca' = plan ? 'plan' : deRutina ? 'rutina' : 'biblioteca'
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
  return {
    plan,
    fuente,
    rango,
    rir,
    pesoCorporal,
    sugerencia: vistaSugerencia(sugerencia, ultima[0] ?? null),
    progreso: progresoDe(historialDe(entrenos.value, ex.name), rir),
  }
}
