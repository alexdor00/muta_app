// Lo que enseña la ficha de un ejercicio (completa y en pequeño): tu plan y tus entrenos.
import { formatDecimal } from '../../../shared/lib/format.ts'
import { plainEffort } from '../domain/effort.ts'
import type { LibraryExercise } from '../domain/exerciseLibrary.ts'
import { progresoDe } from '../domain/exerciseProgress.ts'
import { MUSCLES } from '../domain/muscles.ts'
import { suggestFor, type Sugerencia } from '../domain/progression.ts'
import { historialDe, ultimaVez } from '../domain/workoutHistory.ts'
import { rangoDe, sugerenciaDe, type EjercicioPlan } from '../domain/workoutPlan.ts'
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
  return {
    plan,
    rango,
    rir,
    pesoCorporal,
    sugerencia: vistaSugerencia(sugerencia, ultima[0] ?? null),
    progreso: progresoDe(historialDe(entrenos.value, ex.name), rir),
  }
}

/**
 * La ficha en pequeño de un ejercicio de una sesión (Ver sesión): lo que toca hoy, la clave (si está en la biblioteca),
 * los músculos y el id para abrir la ficha completa (null si no está en la biblioteca).
 */
export function fichaCorta(e: EjercicioPlan, lib: LibraryExercise | null) {
  const s = vistaSugerencia(sugerenciaDe(e), e.ultima[0] ?? null)
  const musculos = [e.musculo, ...e.secundarios].flatMap((m) => (m ? [MUSCLES[m].label] : []))
  return {
    hoy: s.valor,
    etiqueta: s.etiqueta,
    // La explicación del documento de esta rutina manda; si no la trae, la clave de la biblioteca
    clave: e.explicacion ? plainEffort(e.explicacion) : lib?.key ? plainEffort(lib.key) : null,
    musculos: musculos.length ? musculos.join(' · ') : null,
    id: lib?.id ?? null,
  }
}
