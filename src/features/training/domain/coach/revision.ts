// El entrenador de Entreno: cada semana (guía de culturismo natural §5, «¿Subo el volumen? Paso a paso cada semana») mira,
// músculo a músculo, cómo van sus series frente a la vez anterior y propone; nunca cambia nada solo. Reglas decididas por
// el usuario con dos cuestionarios (2026-11-09, docs/decisiones.md):
// - Mejorar = más kilos o más repeticiones que la misma serie de la vez anterior (guía p. 11: «carga o repeticiones»).
// - Solo cuenta un ejercicio si su esfuerzo está estandarizado: el RIR apuntado en todas sus series, a ±1 del de la rutina.
// - Recuperas = no ir peor en el 10 % o más de las series.
// - Toca subir con ≥ 80 % de mejoras (sugerido; la guía: mejorar en 4 de 5 indica volumen corto) durante 3 semanas
//   seguidas: +1 serie, un solo músculo por semana y como mucho +2 series por músculo (el resto, tú en Editar rutina).
// - Ir peor: aviso (sueño, estrés, comida); si se repite, −1 serie.
// - Estancado: sueño, comida y estrés → el RIR → bajar un poco la intensidad (RIR +1) → −1 serie. En definición, mantener
//   ya vale: solo un aviso suave. Las kcal no las toca el entrenador: van en la revisión de peso de Nutrición.
import { addDays } from '../../../../shared/lib/format.ts'
import { MUSCLES, type Mode, type MuscleId, type Range } from '../muscles.ts'
import { claveDe } from '../routineEdit.ts'
import { TOPE_SERIES_SESION } from '../sessionTips.ts'
import type { Entreno } from '../workoutHistory.ts'
import type { SesionPlan } from '../workoutPlan.ts'
import { compararConAntes, type SerieHecha } from '../workoutSet.ts'

/** Series comparadas con la vez anterior: cuántas mejoran y cuántas van peor; `sinRir`, ejercicios que no cuentan. */
export type Mejora = { comparables: number; mejoran: number; peores: number; sinRir: number }

/** «Casi todas»: desde el 80 % de las series (sugerido). */
export const SUBIR_DESDE = 0.8
/** Desde este % de series peor, no recuperas. */
export const PEOR_DESDE = 0.1
/** Con menos series comparadas no se lee nada. */
export const MIN_COMPARABLES = 4
/** Semanas seguidas mejorando en casi todas antes de proponer subir. */
export const SEMANAS_PARA_SUBIR = 3
/** Lo más que el entrenador sube un músculo, sumando sus propuestas aplicadas. */
export const MAX_SERIES_SUBIDAS = 2
/** Lo más que se propone en un ejercicio (compuesto y aislamiento), como el ajuste de volumen. */
const MAX_SERIES = { compuesto: 4, aislamiento: 5 }

/** Lo que hace falta de la pauta de cada ejercicio (por nombre): su rango y su RIR. */
export type Pauta = { rango: Range | null; rir: number }

/**
 * Una serie frente a la misma de la vez anterior: 1 mejora (más kilos sin bajar del mínimo del rango, o más
 * repeticiones con el mismo peso o más), −1 va peor (baja su 1RM estimado sin haber subido el peso), 0 igual; null sin
 * vez anterior.
 */
export function compararSerie(
  s: SerieHecha,
  antes: SerieHecha | null,
  rango: Range | null,
): -1 | 0 | 1 | null {
  const c = compararConAntes(s, antes)
  if (c === null || !antes) return c
  const kg = s.kg ?? 0
  const kgAntes = antes.kg ?? 0
  if (kg > kgAntes && s.reps >= (rango?.[0] ?? antes.reps)) return 1
  if (kg >= kgAntes && s.reps > antes.reps) return 1
  return c === -1 && !(kg > kgAntes) ? -1 : 0
}

/** El esfuerzo está estandarizado: todas las series con su RIR apuntado, a ±1 del de la rutina. */
export const esfuerzoEstandar = (series: readonly SerieHecha[], rir: number | undefined) =>
  rir === undefined || series.every((s) => s.rir !== undefined && Math.abs(s.rir - rir) <= 1)

/**
 * Por músculo, cómo van las series de los entrenos entre `desde` y `hasta` (incluidos) frente a la vez anterior que
 * hiciste ese ejercicio. Con su pauta, solo cuentan los ejercicios con el esfuerzo estandarizado.
 */
export function mejoraPorMusculo(
  entrenos: readonly Entreno[],
  desde: string,
  hasta: string,
  pautas: Readonly<Record<string, Pauta>> = {},
): Partial<Record<MuscleId, Mejora>> {
  const orden = [...entrenos].sort((a, b) => a.inicio - b.inicio)
  const out: Partial<Record<MuscleId, Mejora>> = {}
  orden.forEach((x, k) => {
    if (x.fecha < desde || x.fecha > hasta) return
    for (const e of x.ejercicios) {
      if (!e.musculo) continue
      const antes = orden
        .slice(0, k)
        .reverse()
        .map((y) => y.ejercicios.find((z) => z.nombre === e.nombre))
        .find((z) => z?.series.length)
      if (!antes) continue
      const m = (out[e.musculo] ??= { comparables: 0, mejoran: 0, peores: 0, sinRir: 0 })
      const pauta = pautas[e.nombre]
      if (!esfuerzoEstandar(e.series, pauta?.rir)) {
        m.sinRir++
        continue
      }
      e.series.forEach((s, j) => {
        const c = compararSerie(s, antes.series[j] ?? null, pauta?.rango ?? null)
        if (c === null) return
        m.comparables++
        if (c === 1) m.mejoran++
        if (c === -1) m.peores++
      })
    }
  })
  return out
}

export type Lectura = 'pocos' | 'subir' | 'dulce' | 'estancado' | 'cae'

/** Cómo se lee una semana de series. Ir peor manda: si no recuperas, no se sube. */
export function lecturaMejora(m: Mejora | undefined): Lectura {
  if (!m || m.comparables < MIN_COMPARABLES) return 'pocos'
  if (m.peores / m.comparables >= PEOR_DESDE) return 'cae'
  if (m.mejoran / m.comparables >= SUBIR_DESDE) return 'subir'
  if (m.mejoran > 0) return 'dulce'
  return 'estancado'
}

/** Lo que se aplica con «Aplicar»: las series o el RIR de un ejercicio de una sesión de tu plan. */
export type Propuesta = {
  sigla: string
  clave: string
  nombre: string
  campo: 'series' | 'rir'
  de: number
  a: number
}

export type ConsejoEntrenador = {
  musculo: MuscleId
  lectura: Exclude<Lectura, 'pocos'>
  titulo: string
  detalle: string
  mejora: Mejora
  propuesta: Propuesta | null
  /** Se puede decir «No me interesa» (pasa el músculo a Mantener): solo cuando propone subir. */
  noMeInteresa: boolean
}

const delMusculo = (semana: readonly SesionPlan[], musculo: MuscleId) =>
  semana.flatMap((s) => s.ejercicios.filter((e) => e.musculo === musculo).map((e) => ({ s, e })))

/**
 * +1 serie al ejercicio de ese músculo con menos series de tu semana, sin pasar del máximo por ejercicio ni de las ~11
 * series directas del músculo en esa sesión (volumen basura). null si no cabe en ninguno.
 */
export function propuestaDeSerie(semana: readonly SesionPlan[], musculo: MuscleId): Propuesta | null {
  const huecos = delMusculo(semana, musculo).filter(({ s, e }) => {
    const total = s.ejercicios.filter((x) => x.musculo === musculo).reduce((n, x) => n + x.series, 0)
    return (
      total + 1 <= TOPE_SERIES_SESION &&
      e.series < (e.compuesto ? MAX_SERIES.compuesto : MAX_SERIES.aislamiento)
    )
  })
  const { s, e } = huecos.sort((a, b) => a.e.series - b.e.series)[0] ?? {}
  return s && e
    ? { sigla: s.sigla, clave: claveDe(e), nombre: e.nombre, campo: 'series', de: e.series, a: e.series + 1 }
    : null
}

/** −1 serie al ejercicio de ese músculo con más series (nunca por debajo de 2). null si ninguno tiene más de 2. */
export function propuestaDeQuitar(semana: readonly SesionPlan[], musculo: MuscleId): Propuesta | null {
  const { s, e } =
    delMusculo(semana, musculo)
      .filter((x) => x.e.series > 2)
      .sort((a, b) => b.e.series - a.e.series)[0] ?? {}
  return s && e
    ? { sigla: s.sigla, clave: claveDe(e), nombre: e.nombre, campo: 'series', de: e.series, a: e.series - 1 }
    : null
}

/** Un poco menos de intensidad: RIR +1 en el ejercicio de ese músculo que va más cerca del fallo (hasta RIR 4). */
export function propuestaDeIntensidad(semana: readonly SesionPlan[], musculo: MuscleId): Propuesta | null {
  const { s, e } =
    delMusculo(semana, musculo)
      .filter((x) => x.e.rir < 4)
      .sort((a, b) => a.e.rir - b.e.rir)[0] ?? {}
  return s && e
    ? { sigla: s.sigla, clave: claveDe(e), nombre: e.nombre, campo: 'rir', de: e.rir, a: e.rir + 1 }
    : null
}

/** Las cuatro últimas semanas de un músculo: la de ahora primero. */
export type Semanas = [Mejora | undefined, Mejora | undefined, Mejora | undefined, Mejora | undefined]

const ORDEN_MODO: Record<Mode, number> = { priority: 0, develop: 1, maintain: 2 }
const ORDEN: Record<Exclude<Lectura, 'pocos'>, number> = { subir: 0, cae: 1, estancado: 2, dulce: 3 }
const de = (m: Mejora) => `${m.mejoran} de ${m.comparables}`
/** Cuántas semanas seguidas, desde la de ahora, tienen esa lectura. */
const seguidas = (s: Semanas, lectura: Lectura) => {
  const i = s.findIndex((x) => lecturaMejora(x) !== lectura)
  return i < 0 ? s.length : i
}
const sinRirTexto = (m: Mejora) =>
  m.sinRir
    ? ` (${m.sinRir} ${m.sinRir === 1 ? 'ejercicio no cuenta' : 'ejercicios no cuentan'}: apunta su RIR en cada serie, cerca del de la rutina.)`
    : ''

/**
 * La revisión de la semana: un consejo por músculo con series que comparar, primero los que piden algo.
 * `aplicadoHace`: músculos con un cambio aplicado la semana pasada (se espera a ver su efecto); `subidas`: series que el
 * entrenador ya les sumó.
 */
export function revisionEntrenador(datos: {
  semanas: Partial<Record<MuscleId, Semanas>>
  semana: readonly SesionPlan[]
  definicion: boolean
  modos: Partial<Record<MuscleId, Mode>>
  aplicadoHace?: ReadonlySet<MuscleId>
  subidas?: Partial<Record<MuscleId, number>>
}): ConsejoEntrenador[] {
  const out: ConsejoEntrenador[] = []
  const lista = (Object.entries(datos.semanas) as [MuscleId, Semanas][]).sort(
    ([a], [b]) => ORDEN_MODO[datos.modos[a] ?? 'develop'] - ORDEN_MODO[datos.modos[b] ?? 'develop'],
  )
  // Un solo músculo por semana para subir: el primero que cumple (Prioridad antes que Desarrollar)
  let yaSube = false
  for (const [musculo, s] of lista) {
    const ahora = s[0]
    const lectura = lecturaMejora(ahora)
    if (lectura === 'pocos' || !ahora) continue
    const nombre = MUSCLES[musculo].label
    const modo = datos.modos[musculo] ?? 'develop'
    const espera = datos.aplicadoHace?.has(musculo) ?? false
    const base = { musculo, mejora: ahora, propuesta: null, noMeInteresa: false }
    const extra = sinRirTexto(ahora)

    if (lectura === 'subir') {
      if (modo === 'maintain') continue
      const titulo = `${nombre}: mejoras en ${de(ahora)} series`
      const semanas = seguidas(s, 'subir')
      const subidas = datos.subidas?.[musculo] ?? 0
      const dulce = (detalle: string) =>
        out.push({ ...base, lectura: 'dulce', titulo, detalle: detalle + extra })
      if (espera) dulce('Ya le subiste volumen: esta semana vemos cómo responde.')
      else if (semanas < SEMANAS_PARA_SUBIR)
        dulce(
          `Progresas en casi todas (${semanas} de ${SEMANAS_PARA_SUBIR} semanas seguidas). Si sigue así, te propondré subir volumen.`,
        )
      else if (subidas >= MAX_SERIES_SUBIDAS)
        dulce(
          `Sigues progresando con las ${MAX_SERIES_SUBIDAS} series que ya le subiste. Si quieres más, añádelas tú en Editar rutina.`,
        )
      else if (yaSube)
        dulce('También podrías subir aquí, pero mejor un músculo cada vez: lo vemos la semana que viene.')
      else {
        yaSube = true
        const propuesta = propuestaDeSerie(datos.semana, musculo)
        out.push({
          ...base,
          lectura,
          titulo,
          propuesta,
          noMeInteresa: true,
          detalle:
            (propuesta
              ? `${semanas} semanas mejorando en casi todas y sin ir peor: toca subir volumen. Te propongo una serie más en ${propuesta.nombre} (${propuesta.sigla}).`
              : `${semanas} semanas mejorando en casi todas: toca subir volumen, pero ya no cabe otra serie. Añade un ejercicio de ${nombre.toLowerCase()} en otra sesión, a 48 h o más de las que ya lo trabajan y sin pisar los músculos de ese día.`) +
            (datos.definicion
              ? ' En definición el margen es más estrecho: si empiezas a ir peor, vuelve atrás.'
              : '') +
            extra,
        })
      }
      continue
    }

    if (lectura === 'cae') {
      const repite = lecturaMejora(s[1]) === 'cae'
      const propuesta = repite && !espera ? propuestaDeQuitar(datos.semana, musculo) : null
      out.push({
        ...base,
        lectura,
        propuesta,
        titulo: `${nombre}: vas peor en ${ahora.peores} de ${ahora.comparables} series`,
        detalle:
          (propuesta
            ? `Segunda semana yendo peor: te propongo una serie menos en ${propuesta.nombre} (${propuesta.sigla}) para recuperar. Y sigue cuidando el sueño, el estrés y la comida.`
            : 'Antes de quitar series, revisa el sueño, el estrés y la comida. Si la semana que viene sigues igual, te propondré una serie menos.') +
          extra,
      })
      continue
    }

    if (lectura === 'estancado') {
      // Mantener: estable es justo lo que quieres
      if (modo === 'maintain') continue
      const titulo = `${nombre}: igual que la vez anterior`
      if (datos.definicion) {
        out.push({
          ...base,
          lectura,
          titulo,
          detalle:
            'En definición, mantener tus marcas ya está bien. Si se alarga, revisa el sueño y que comes lo de tu plan.' +
            extra,
        })
        continue
      }
      const semanas = seguidas(s, 'estancado')
      const propuesta = espera
        ? null
        : semanas === 3
          ? propuestaDeIntensidad(datos.semana, musculo)
          : semanas >= 4
            ? propuestaDeQuitar(datos.semana, musculo)
            : null
      const detalle =
        semanas === 1
          ? 'Primero lo básico: duerme bien, come lo que marca tu plan y baja el estrés. No cambies de ejercicio: eso no arregla un estancamiento.'
          : semanas === 2
            ? 'Segunda semana igual: revisa que llegas al RIR que toca en cada serie; si te sobran repeticiones, acércate más.'
            : semanas === 3
              ? propuesta
                ? `Tercera semana igual: un poco menos de intensidad deja estirar el volumen. Te propongo RIR ${propuesta.a} en ${propuesta.nombre} (${propuesta.sigla}).`
                : 'Tercera semana igual: prueba a dejar una repetición más en reserva en sus ejercicios.'
              : propuesta
                ? `Ya van ${semanas} semanas igual con todo lo anterior: te propongo una serie menos en ${propuesta.nombre} (${propuesta.sigla}) para recuperar mejor.`
                : `Ya van ${semanas} semanas igual: revisa con calma el descanso y la técnica en vídeo.`
      out.push({ ...base, lectura, titulo, detalle: detalle + extra, propuesta })
      continue
    }

    out.push({
      ...base,
      lectura,
      titulo: `${nombre}: mejoras en ${de(ahora)} series`,
      detalle: 'Mantienes la mayoría y mejoras en algunas: es el punto dulce. No toques nada.' + extra,
    })
  }
  return out.sort((a, b) => ORDEN[a.lectura] - ORDEN[b.lectura])
}

/** El lunes de la semana de una fecha (AAAA-MM-DD): las revisiones van por semanas. */
export function lunesDe(fecha: string): string {
  const dia = (new Date(`${fecha}T12:00:00`).getDay() + 6) % 7
  return addDays(fecha, -dia)
}
