// El entrenador de Entreno: cada semana (guía de culturismo natural §5, «paso a paso cada semana») mira, músculo a
// músculo, cómo van sus series frente a la vez anterior y propone; nunca cambia nada solo. Reglas decididas por el usuario
// el 2026-11-09 (docs/decisiones.md):
// - Mejorar = doble progresión: llegar al máximo del rango de repeticiones con el mismo peso o más, o haber subido el
//   peso sin bajar del mínimo del rango. Ir peor = el 1RM estimado baja.
// - Recuperas = las series no bajan: en cuanto el 10 % o más van peor, no se sube.
// - Casi todas (≥ 80 %, sugerido: la guía no da cifra; su ejemplo de 4 de 5 indica volumen corto) y recuperas → toca
//   subir volumen: +1 serie al ejercicio con menos series. No todos a la vez: como mucho 2 músculos por semana, primero los
//   de Prioridad; los de Mantener no suben. Tras subir uno, se espera una semana para ver el efecto.
// - Vas peor (≥ 10 % de series): aviso (sueño, estrés, comida); si se repite la semana siguiente, −1 serie.
// - Estancado (ninguna mejora y ninguna peor): 1.ª semana, sueño y comida (y en volumen, un poco más de kcal); 2.ª, el
//   RIR; 3.ª, +1 serie. En definición, mantener ya vale: solo un aviso suave. Los de Mantener, estables, están bien.
import { addDays } from '../../../../shared/lib/format.ts'
import { MUSCLES, type Mode, type MuscleId, type Range } from '../muscles.ts'
import { claveDe } from '../routineEdit.ts'
import { TOPE_SERIES_SESION } from '../sessionTips.ts'
import type { Entreno } from '../workoutHistory.ts'
import type { SesionPlan } from '../workoutPlan.ts'
import { compararConAntes, type SerieHecha } from '../workoutSet.ts'

/** Series comparadas con la vez anterior: cuántas mejoran y cuántas van peor. */
export type Mejora = { comparables: number; mejoran: number; peores: number }

/** «Casi todas»: desde el 80 % de las series (sugerido). */
export const SUBIR_DESDE = 0.8
/** Desde este % de series peor, no recuperas. */
export const PEOR_DESDE = 0.1
/** Con menos series comparadas no se lee nada. */
export const MIN_COMPARABLES = 4
/** Músculos a los que se propone subir en una misma semana (sugerido). */
export const MAX_SUBIDAS = 2
/** Lo más que se propone en un ejercicio (compuesto y aislamiento), como el ajuste de volumen. */
const MAX_SERIES = { compuesto: 4, aislamiento: 5 }

/**
 * Una serie frente a la misma de la vez anterior con la doble progresión de su rango: 1 mejora, −1 va peor (baja su 1RM
 * estimado), 0 igual; null sin vez anterior. Sin rango conocido, mejora si sube su 1RM estimado.
 */
export function compararSerie(
  s: SerieHecha,
  antes: SerieHecha | null,
  rango: Range | null,
): -1 | 0 | 1 | null {
  const c = compararConAntes(s, antes)
  if (c === null || !antes || !rango) return c
  // Subir el peso y bajar a la parte baja del rango es progresar, aunque el 1RM estimado salga algo menor
  const kg = s.kg ?? 0
  const kgAntes = antes.kg ?? 0
  if (kg > kgAntes && s.reps >= rango[0]) return 1
  if (kg >= kgAntes && s.reps >= rango[1]) return 1
  return c === -1 ? -1 : 0
}

/**
 * Por músculo, cómo van las series de los entrenos entre `desde` y `hasta` (incluidos) frente a la vez anterior que
 * hiciste ese ejercicio. `rangos`: el rango de repeticiones de cada ejercicio (por nombre) en tu plan.
 */
export function mejoraPorMusculo(
  entrenos: readonly Entreno[],
  desde: string,
  hasta: string,
  rangos: Readonly<Record<string, Range>> = {},
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
      const m = (out[e.musculo] ??= { comparables: 0, mejoran: 0, peores: 0 })
      e.series.forEach((s, j) => {
        const c = compararSerie(s, antes.series[j] ?? null, rangos[e.nombre] ?? null)
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

/** Lo que se aplica con «Aplicar»: cambiar las series de un ejercicio de una sesión de tu plan. */
export type Propuesta = { sigla: string; clave: string; nombre: string; de: number; a: number }

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

/**
 * +1 serie al ejercicio de ese músculo con menos series de tu semana, sin pasar del máximo por ejercicio ni de las ~11
 * series directas del músculo en esa sesión (volumen basura). null si no cabe en ninguno.
 */
export function propuestaDeSerie(semana: readonly SesionPlan[], musculo: MuscleId): Propuesta | null {
  const huecos = semana.flatMap((s) => {
    const delMusculo = s.ejercicios.filter((e) => e.musculo === musculo)
    const total = delMusculo.reduce((n, e) => n + e.series, 0)
    if (total + 1 > TOPE_SERIES_SESION) return []
    return delMusculo
      .filter((e) => e.series < (e.compuesto ? MAX_SERIES.compuesto : MAX_SERIES.aislamiento))
      .map((e) => ({ sigla: s.sigla, clave: claveDe(e), nombre: e.nombre, de: e.series, a: e.series + 1 }))
  })
  return huecos.sort((a, b) => a.de - b.de)[0] ?? null
}

/** −1 serie al ejercicio de ese músculo con más series (nunca por debajo de 2). null si ninguno tiene más de 2. */
export function propuestaDeQuitar(semana: readonly SesionPlan[], musculo: MuscleId): Propuesta | null {
  const conMas = semana.flatMap((s) =>
    s.ejercicios
      .filter((e) => e.musculo === musculo && e.series > 2)
      .map((e) => ({ sigla: s.sigla, clave: claveDe(e), nombre: e.nombre, de: e.series, a: e.series - 1 })),
  )
  return conMas.sort((a, b) => b.de - a.de)[0] ?? null
}

/** Las tres últimas semanas de un músculo: la de ahora, la anterior y la de antes. */
export type Semanas = [Mejora | undefined, Mejora | undefined, Mejora | undefined]

const ORDEN_MODO: Record<Mode, number> = { priority: 0, develop: 1, maintain: 2 }
const ORDEN: Record<Exclude<Lectura, 'pocos'>, number> = { subir: 0, cae: 1, estancado: 2, dulce: 3 }
const de = (m: Mejora) => `${m.mejoran} de ${m.comparables}`

/**
 * La revisión de la semana: un consejo por músculo con series que comparar, primero los que piden algo.
 * `aplicadoHace`: músculos a los que aplicaste un cambio la semana pasada (se espera a ver su efecto).
 */
export function revisionEntrenador(datos: {
  semanas: Partial<Record<MuscleId, Semanas>>
  semana: readonly SesionPlan[]
  fase: 'definicion' | 'volumen' | 'otra'
  modos: Partial<Record<MuscleId, Mode>>
  aplicadoHace?: ReadonlySet<MuscleId>
}): ConsejoEntrenador[] {
  const out: ConsejoEntrenador[] = []
  const definicion = datos.fase === 'definicion'
  const lista = (Object.entries(datos.semanas) as [MuscleId, Semanas][]).sort(
    ([a], [b]) => ORDEN_MODO[datos.modos[a] ?? 'develop'] - ORDEN_MODO[datos.modos[b] ?? 'develop'],
  )
  let subidas = 0
  for (const [musculo, [ahora, anterior, antes]] of lista) {
    const lectura = lecturaMejora(ahora)
    if (lectura === 'pocos' || !ahora) continue
    const nombre = MUSCLES[musculo].label
    const modo = datos.modos[musculo] ?? 'develop'
    const espera = datos.aplicadoHace?.has(musculo) ?? false
    const base = { musculo, mejora: ahora, propuesta: null, noMeInteresa: false }

    if (lectura === 'subir') {
      if (modo === 'maintain') continue
      const titulo = `${nombre}: mejoras en ${de(ahora)} series`
      if (espera) {
        out.push({
          ...base,
          lectura: 'dulce',
          titulo,
          detalle: 'Ya le subiste volumen: esta semana vemos cómo responde.',
        })
        continue
      }
      if (subidas >= MAX_SUBIDAS) {
        out.push({
          ...base,
          lectura: 'dulce',
          titulo,
          detalle:
            'También progresas aquí, pero no conviene subir todos los músculos a la vez: lo vemos la semana que viene.',
        })
        continue
      }
      subidas++
      const propuesta = propuestaDeSerie(datos.semana, musculo)
      out.push({
        ...base,
        lectura,
        titulo,
        propuesta,
        noMeInteresa: true,
        detalle:
          (propuesta
            ? `Progresas en casi todas y no bajas en ninguna: toca subir volumen. Te propongo una serie más en ${propuesta.nombre} (${propuesta.sigla}).`
            : `Progresas en casi todas y no bajas en ninguna: toca subir volumen, pero ya no cabe otra serie sin pasarte en una sesión: añade un ejercicio de ${nombre.toLowerCase()} en otra.`) +
          (definicion
            ? ' En definición el margen es más estrecho: si empiezas a ir peor, vuelve atrás.'
            : ''),
      })
      continue
    }

    if (lectura === 'cae') {
      const repite = lecturaMejora(anterior) === 'cae'
      const propuesta = repite && !espera ? propuestaDeQuitar(datos.semana, musculo) : null
      out.push({
        ...base,
        lectura,
        propuesta,
        titulo: `${nombre}: vas peor en ${ahora.peores} de ${ahora.comparables} series`,
        detalle: propuesta
          ? `Segunda semana yendo peor: te propongo una serie menos en ${propuesta.nombre} (${propuesta.sigla}) para recuperar. Y sigue cuidando el sueño, el estrés y la comida.`
          : 'Antes de quitar series, revisa el sueño, el estrés y la comida. Si la semana que viene sigues igual, te propondré una serie menos.',
      })
      continue
    }

    if (lectura === 'estancado') {
      // Mantener: estable es justo lo que quieres
      if (modo === 'maintain') continue
      const titulo = `${nombre}: igual que la vez anterior`
      if (definicion) {
        out.push({
          ...base,
          lectura,
          titulo,
          detalle:
            'En definición, mantener tus marcas ya está bien. Si se alarga, revisa el sueño y que comes lo de tu plan.',
        })
        continue
      }
      const semanasIgual =
        lecturaMejora(anterior) === 'estancado' ? (lecturaMejora(antes) === 'estancado' ? 3 : 2) : 1
      const propuesta = semanasIgual >= 3 && !espera ? propuestaDeSerie(datos.semana, musculo) : null
      const detalle =
        semanasIgual === 1
          ? 'Primero lo básico: duerme bien, come lo que marca tu plan y baja el estrés.' +
            (datos.fase === 'volumen'
              ? ' En volumen, puedes subir un poco las calorías (mejor los días de entreno).'
              : '')
          : semanasIgual === 2
            ? 'Segunda semana igual: revisa que llegas al RIR que toca en cada serie; si te sobran repeticiones, acércate más.'
            : propuesta
              ? `Tercera semana igual con lo básico y el RIR en orden: te propongo una serie más en ${propuesta.nombre} (${propuesta.sigla}).`
              : 'Tercera semana igual: prueba con algo más de volumen en otra sesión (ya no cabe otra serie en las que tiene).'
      out.push({ ...base, lectura, titulo, detalle, propuesta })
      continue
    }

    out.push({
      ...base,
      lectura,
      titulo: `${nombre}: mejoras en ${de(ahora)} series`,
      detalle: 'Progresas en algunas y mantienes el resto: es el punto dulce. No toques nada.',
    })
  }
  return out.sort((a, b) => ORDEN[a.lectura] - ORDEN[b.lectura])
}

/** El lunes de la semana de una fecha (AAAA-MM-DD): las revisiones van por semanas. */
export function lunesDe(fecha: string): string {
  const dia = (new Date(`${fecha}T12:00:00`).getDay() + 6) % 7
  return addDays(fecha, -dia)
}
