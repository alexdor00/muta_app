// Los entrenos terminados (almacén `workouts`) y lo que se calcula con ellos: la vez anterior de un ejercicio, su
// historial, el progreso de una sesión, tu semana y las series de cada músculo. Una sola fuente: no hay otra copia.
import type { VezEjercicio } from './exerciseProgress.ts'
import type { MuscleId } from './muscles.ts'
import type { SesionPlan } from './workoutPlan.ts'
import type { SerieHecha } from './workoutSet.ts'

export type EjercicioGuardado = {
  /** El nombre de lo que se hizo (si se cambió hoy, el del sustituto). */
  nombre: string
  musculo: MuscleId | null
  /** Solo las series hechas. */
  series: SerieHecha[]
  /** Puesto en la sesión (1 = el primero). */
  puesto: number
}

/** Un entreno terminado. */
export type Entreno = {
  id: string
  /** AAAA-MM-DD, en hora local. */
  fecha: string
  /** Cuándo empezó (ms) y cuánto duró sin las pausas. */
  inicio: number
  segundos: number
  sigla: string
  nombre: string
  programId: string
  ejercicios: EjercicioGuardado[]
}

/** Los entrenos de más antiguo a más reciente. */
const enOrden = (entrenos: readonly Entreno[]) => [...entrenos].sort((a, b) => a.inicio - b.inicio)

/** Lo que hiciste la última vez en un ejercicio (serie a serie); vacío si nunca. */
export function ultimaVez(entrenos: readonly Entreno[], nombre: string): SerieHecha[] {
  for (const x of enOrden(entrenos).reverse()) {
    const e = x.ejercicios.find((y) => y.nombre === nombre)
    if (e?.series.length) return e.series
  }
  return []
}

/** Cada vez que se hizo un ejercicio, la más antigua primero, con su puesto en la sesión. */
export function historialDe(entrenos: readonly Entreno[], nombre: string): VezEjercicio[] {
  return enOrden(entrenos).flatMap((x) => {
    const e = x.ejercicios.find((y) => y.nombre === nombre)
    return e?.series.length ? [{ fecha: x.fecha, series: e.series, puesto: e.puesto }] : []
  })
}

/** Cada vez que se hizo una sesión (la más antigua primero): toneladas, repeticiones y minutos. */
export function progresoDeSesion(entrenos: readonly Entreno[], sigla: string) {
  return enOrden(entrenos)
    .filter((x) => x.sigla === sigla)
    .map((x) => {
      const series = x.ejercicios.flatMap((e) => e.series)
      return {
        fecha: x.fecha,
        toneladas: Math.round(series.reduce((t, s) => t + (s.kg ?? 0) * s.reps, 0) / 100) / 10,
        reps: series.reduce((t, s) => t + s.reps, 0),
        minutos: Math.round(x.segundos / 60),
      }
    })
}

const DIA = 86_400_000
const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export type DiaSemana = {
  letra: string
  dia: number
  sigla: string
  estado: 'hecho' | 'hoy' | 'pendiente' | 'descanso'
  /** ¿Es hoy? (también si hoy es descanso o ya entrenaste). */
  hoy: boolean
}

/** Lo que hace falta de tu plan para repartir la semana: tus sesiones en orden, la que toca y tus descansos. */
export type PlanSemana = {
  /** Las siglas de tus sesiones, en el orden de la rutina. */
  orden: readonly string[]
  /** La que toca (su puesto en `orden`). */
  siguiente: number
  /** Tras qué sesiones (1 = la primera) va un descanso obligatorio; repetido, dos días. */
  tras: readonly number[]
  /** Días de descanso que aún se deben antes de la siguiente, empezando por el primer día sin entrenar (hoy o mañana). */
  pendientes: number
}

/**
 * Tu semana de lunes a domingo: lo entrenado, con ✓ y su sigla; los días pasados sin entrenar, como descanso. Con tu plan,
 * desde el primer día sin entrenar se reparten las sesiones que tocan en su orden, con sus descansos obligatorios detrás
 * (la rutina va por rotación: si un día no entrenas, todo se corre). Sin plan, lo que falta va vacío.
 */
export function semanaDe(entrenos: readonly Entreno[], hoy: string, plan?: PlanSemana): DiaSemana[] {
  const t = Date.parse(`${hoy}T00:00:00Z`)
  const lunes = t - ((new Date(t).getUTCDay() + 6) % 7) * DIA
  let siguiente = plan?.siguiente ?? 0
  let pendientes = plan?.pendientes ?? 0
  const dias: Omit<DiaSemana, 'hoy'>[] = LETRAS.map((letra, i) => {
    const d = lunes + i * DIA
    const fecha = new Date(d).toISOString().slice(0, 10)
    const hecho = enOrden(entrenos).find((x) => x.fecha === fecha)
    const dia = new Date(d).getUTCDate()
    if (hecho) return { letra, dia, sigla: hecho.sigla, estado: 'hecho' }
    if (d < t) return { letra, dia, sigla: '', estado: 'descanso' }
    if (!plan?.orden.length) return { letra, dia, sigla: '', estado: d === t ? 'hoy' : 'pendiente' }
    if (pendientes > 0) {
      pendientes -= 1
      return { letra, dia, sigla: '', estado: 'descanso' }
    }
    const sigla = plan.orden[siguiente % plan.orden.length]
    pendientes = plan.tras.filter((x) => x === (siguiente % plan.orden.length) + 1).length
    siguiente += 1
    return { letra, dia, sigla, estado: d === t ? 'hoy' : 'pendiente' }
  })
  return dias.map((x, i) => ({ ...x, hoy: lunes + i * DIA === t }))
}

/** Series directas por músculo de una lista de ejercicios (una por serie, al músculo principal). */
function porMusculo(ejercicios: readonly { musculo: MuscleId | null; series: number }[]) {
  const cuenta: Partial<Record<MuscleId, number>> = {}
  for (const e of ejercicios) if (e.musculo) cuenta[e.musculo] = (cuenta[e.musculo] ?? 0) + e.series
  return cuenta
}

/**
 * Series por músculo de hoy (lo que pide la sesión que toca o, si ya entrenaste, lo hecho) y de la semana (lo hecho
 * de lunes a hoy más lo que toca hoy, si aún no has entrenado).
 */
export function seriesPorMusculo(entrenos: readonly Entreno[], hoy: string, toca: SesionPlan | null) {
  const t = Date.parse(`${hoy}T00:00:00Z`)
  const lunes = new Date(t - ((new Date(t).getUTCDay() + 6) % 7) * DIA).toISOString().slice(0, 10)
  const hechos = (desde: string) =>
    entrenos
      .filter((x) => x.fecha >= desde && x.fecha <= hoy)
      .flatMap((x) => x.ejercicios.map((e) => ({ musculo: e.musculo, series: e.series.length })))
  const deHoy = hechos(hoy)
  const pendiente = deHoy.length ? [] : (toca?.ejercicios ?? [])
  return {
    hoy: porMusculo(deHoy.length ? deHoy : pendiente),
    semana: porMusculo([...hechos(lunes), ...pendiente]),
  }
}
