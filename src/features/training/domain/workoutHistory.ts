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

/**
 * Cómo se reconoce un ejercicio entre rutinas (usuario, 2026-11-23): su ejercicio de la biblioteca o, si no tiene, su
 * nombre. Así el mismo ejercicio sigue su historia aunque en otra rutina se llame distinto. De serie, el nombre.
 */
export type Clave = (nombre: string) => string
const porSuNombre: Clave = (n) => n

/**
 * Tus entrenos con un solo nombre por ejercicio (los que comparten `clave`): el de la biblioteca (`nombreDe`) o, si no
 * está en ella, el último con el que lo hiciste. Lo que agrupa por nombre (Progreso) los cuenta como uno aunque en otra
 * rutina se llamara distinto (usuario, 2026-11-23); «Serie top: Press banca» y su serie de descarga salen como «Press banca».
 */
export function unificarNombres(
  entrenos: readonly Entreno[],
  clave: Clave,
  nombreDe: (clave: string) => string | null = () => null,
): Entreno[] {
  const ultimo = new Map<string, string>()
  for (const x of enOrden(entrenos))
    for (const e of x.ejercicios) {
      const k = clave(e.nombre)
      ultimo.set(k, nombreDe(k) ?? e.nombre)
    }
  return entrenos.map((x) => ({
    ...x,
    ejercicios: x.ejercicios.map((e) => ({ ...e, nombre: ultimo.get(clave(e.nombre)) ?? e.nombre })),
  }))
}

/** Los entrenos de más antiguo a más reciente. */
const enOrden = (entrenos: readonly Entreno[]) => [...entrenos].sort((a, b) => a.inicio - b.inicio)

/**
 * Cómo se busca un ejercicio en tu historia: por su nombre exacto si alguna vez lo hiciste con ese nombre (así una serie
 * top no toma la vez anterior de su serie de descarga, que es el mismo ejercicio con otra pauta); si nunca, por su
 * `clave` (lo hiciste en otra rutina con otro nombre).
 */
function buscador(entrenos: readonly Entreno[], nombre: string, clave: Clave, exactoPrimero = true) {
  const exacto =
    exactoPrimero && entrenos.some((x) => x.ejercicios.some((y) => y.nombre === nombre && y.series.length))
  const k = clave(nombre)
  return (y: EjercicioGuardado) => (exacto ? y.nombre === nombre : clave(y.nombre) === k)
}

/** Lo que hiciste la última vez en un ejercicio (serie a serie); vacío si nunca. */
export function ultimaVez(
  entrenos: readonly Entreno[],
  nombre: string,
  clave: Clave = porSuNombre,
): SerieHecha[] {
  const es = buscador(entrenos, nombre, clave)
  for (const x of enOrden(entrenos).reverse()) {
    const e = x.ejercicios.find(es)
    if (e?.series.length) return e.series
  }
  return []
}

/**
 * Cada vez que se hizo un ejercicio, la más antigua primero, con su puesto en la sesión. Con `todo` (la ficha), todas
 * sus variantes por su `clave`: si un día lo hiciste dos veces (serie top y de descarga), van juntas.
 */
export function historialDe(
  entrenos: readonly Entreno[],
  nombre: string,
  clave: Clave = porSuNombre,
  todo = false,
): VezEjercicio[] {
  const es = buscador(entrenos, nombre, clave, !todo)
  return enOrden(entrenos).flatMap((x) => {
    const hechos = x.ejercicios.filter((y) => es(y) && y.series.length)
    const [e] = hechos
    if (!e) return []
    return [{ fecha: x.fecha, series: todo ? hechos.flatMap((y) => y.series) : e.series, puesto: e.puesto }]
  })
}

/**
 * Cada vez que se hizo una sesión (la más antigua primero): toneladas, repeticiones y minutos. Con `programId`, solo
 * las de esa rutina (usuario, 2026-11-23: la A1 de otra rutina es otra sesión).
 */
export function progresoDeSesion(entrenos: readonly Entreno[], sigla: string, programId?: string) {
  return enOrden(entrenos)
    .filter((x) => x.sigla === sigla && (programId === undefined || x.programId === programId))
    .map((x) => {
      // Las bajadas y mini-series también suman al volumen
      const series = x.ejercicios.flatMap((e) => e.series.flatMap((s) => [s, ...(s.extra ?? [])]))
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
  return diasDesde(entrenos, hoy, new Date(lunes).toISOString().slice(0, 10), 7, plan).map((x, i) => ({
    letra: LETRAS[i],
    dia: new Date(lunes + i * DIA).getUTCDate(),
    sigla: x.sigla,
    estado: x.estado,
    hoy: lunes + i * DIA === t,
  }))
}

/** Un día cualquiera con lo que hiciste o lo que toca (como en Tu semana). */
export type DiaPrevisto = { fecha: string; sigla: string; estado: DiaSemana['estado'] }

/**
 * `n` días desde `inicio`, repartidos como Tu semana: lo entrenado, los días pasados sin entrenar como descanso y, desde el
 * primer día sin entrenar, las sesiones en su orden con sus descansos obligatorios. Sirve a Comida para saber qué días son
 * de entreno (el menú y la compra).
 */
export function diasDesde(
  entrenos: readonly Entreno[],
  hoy: string,
  inicio: string,
  n: number,
  plan?: PlanSemana,
): DiaPrevisto[] {
  const t = Date.parse(`${hoy}T00:00:00Z`)
  const desde = Date.parse(`${inicio}T00:00:00Z`)
  const orden = enOrden(entrenos)
  let siguiente = plan?.siguiente ?? 0
  let pendientes = plan?.pendientes ?? 0
  return Array.from({ length: n }, (_, i): DiaPrevisto => {
    const d = desde + i * DIA
    const fecha = new Date(d).toISOString().slice(0, 10)
    const hecho = orden.find((x) => x.fecha === fecha)
    if (hecho) return { fecha, sigla: hecho.sigla, estado: 'hecho' }
    if (d < t) return { fecha, sigla: '', estado: 'descanso' }
    if (!plan?.orden.length) return { fecha, sigla: '', estado: d === t ? 'hoy' : 'pendiente' }
    if (pendientes > 0) {
      pendientes -= 1
      return { fecha, sigla: '', estado: 'descanso' }
    }
    const sigla = plan.orden[siguiente % plan.orden.length]
    pendientes = plan.tras.filter((x) => x === (siguiente % plan.orden.length) + 1).length
    siguiente += 1
    return { fecha, sigla, estado: d === t ? 'hoy' : 'pendiente' }
  })
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
