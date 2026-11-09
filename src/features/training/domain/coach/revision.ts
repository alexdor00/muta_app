// El entrenador de Entreno: cada semana mira, músculo a músculo, en cuántas series mejoras frente a la vez anterior y lo
// lee como la guía de culturismo natural (docs/conocimiento/04-guia-culturismo-natural.md §5 y decisiones del 2026-11-08,
// §14): casi todas mejoran y recuperas → puedes subir volumen (+1 serie); algunas → punto dulce, no tocar; ninguna →
// no cambies de ejercicio, revisa técnica y esfuerzo; rindes peor → sueño, estrés y comida antes de quitar series.
// Solo propone: nada cambia hasta que lo aplicas.
import { addDays } from '../../../../shared/lib/format.ts'
import { MUSCLES, type MuscleId } from '../muscles.ts'
import { claveDe } from '../routineEdit.ts'
import { TOPE_SERIES_SESION } from '../sessionTips.ts'
import type { Entreno } from '../workoutHistory.ts'
import type { SesionPlan } from '../workoutPlan.ts'
import { compararConAntes } from '../workoutSet.ts'

/** Series comparadas con la vez anterior: cuántas mejoran y cuántas van peor. */
export type Mejora = { comparables: number; mejoran: number; peores: number }

/** «Casi todas»: desde el 80 % de las series (sugerido: la guía no da cifra). */
export const SUBIR_DESDE = 0.8
/** Con menos series comparadas no se lee nada. */
export const MIN_COMPARABLES = 4
/** Lo más que se propone en un ejercicio (compuesto y aislamiento), como el ajuste de volumen. */
const MAX_SERIES = { compuesto: 4, aislamiento: 5 }

/**
 * Por músculo, en cuántas series de los entrenos desde `desde` (incluido) mejoras la misma serie de la vez anterior
 * que hiciste ese ejercicio.
 */
export function mejoraPorMusculo(
  entrenos: readonly Entreno[],
  desde: string,
): Partial<Record<MuscleId, Mejora>> {
  const orden = [...entrenos].sort((a, b) => a.inicio - b.inicio)
  const out: Partial<Record<MuscleId, Mejora>> = {}
  orden.forEach((x, k) => {
    if (x.fecha < desde) return
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
        const c = compararConAntes(s, antes.series[j] ?? null)
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

/** Cómo lee la guía una semana de series. */
export function lecturaMejora(m: Mejora): Lectura {
  if (m.comparables < MIN_COMPARABLES) return 'pocos'
  if (m.peores > m.mejoran && m.peores / m.comparables >= 0.5) return 'cae'
  if (m.mejoran / m.comparables >= SUBIR_DESDE) return 'subir'
  if (m.mejoran > 0) return 'dulce'
  return 'estancado'
}

/** Lo que se aplica con «Aplicar»: una serie más a un ejercicio de una sesión de tu plan. */
export type Propuesta = { sigla: string; clave: string; nombre: string; de: number; a: number }

export type ConsejoEntrenador = {
  musculo: MuscleId
  lectura: Exclude<Lectura, 'pocos'>
  titulo: string
  detalle: string
  mejora: Mejora
  propuesta: Propuesta | null
}

/**
 * +1 serie al ejercicio de ese músculo con menos series de tu semana, sin pasar del máximo por ejercicio ni de las ~11
 * series directas del músculo en esa sesión (volumen basura). null si no cabe en ninguno.
 */
export function propuestaDeSerie(semana: readonly SesionPlan[], musculo: MuscleId): Propuesta | null {
  const huecos = semana.flatMap((s) => {
    const delMusculo = s.ejercicios.filter((e) => e.musculo === musculo)
    const total = delMusculo.reduce((n, e) => n + e.series, 0)
    return delMusculo
      .filter((e) => e.series < (e.compuesto ? MAX_SERIES.compuesto : MAX_SERIES.aislamiento))
      .filter(() => total + 1 <= TOPE_SERIES_SESION)
      .map((e) => ({ sigla: s.sigla, clave: claveDe(e), nombre: e.nombre, de: e.series, a: e.series + 1 }))
  })
  return huecos.sort((a, b) => a.de - b.de)[0] ?? null
}

const pct = (m: Mejora) => `${m.mejoran} de ${m.comparables}`

/**
 * La revisión de la semana: un consejo por músculo con series que comparar, primero los que piden algo. `definicion`
 * cambia el tono (en déficit también se progresa, pero el margen es más estrecho).
 */
export function revisionEntrenador(datos: {
  mejora: Partial<Record<MuscleId, Mejora>>
  semana: readonly SesionPlan[]
  definicion: boolean
}): ConsejoEntrenador[] {
  const orden: Record<Exclude<Lectura, 'pocos'>, number> = { subir: 0, cae: 1, estancado: 2, dulce: 3 }
  const out: ConsejoEntrenador[] = []
  for (const [musculo, m] of Object.entries(datos.mejora) as [MuscleId, Mejora][]) {
    const lectura = lecturaMejora(m)
    if (lectura === 'pocos') continue
    const nombre = MUSCLES[musculo].label
    if (lectura === 'subir') {
      const propuesta = propuestaDeSerie(datos.semana, musculo)
      out.push({
        musculo,
        lectura,
        mejora: m,
        propuesta,
        titulo: `${nombre}: mejoras en ${pct(m)} series`,
        detalle:
          (propuesta
            ? `Progresas en casi todas y recuperas: puedes subir volumen. Te propongo una serie más en ${propuesta.nombre} (${propuesta.sigla}).`
            : `Progresas en casi todas y recuperas: puedes subir volumen, pero ya no cabe otra serie sin pasarte en una sesión: añade un ejercicio de ${nombre.toLowerCase()} en otra.`) +
          (datos.definicion
            ? ' En definición el margen es más estrecho: si dejas de recuperar, vuelve atrás.'
            : ''),
      })
    } else if (lectura === 'dulce') {
      out.push({
        musculo,
        lectura,
        mejora: m,
        propuesta: null,
        titulo: `${nombre}: mejoras en ${pct(m)} series`,
        detalle: 'Progresas en algunas y mantienes el resto: es el punto dulce. No toques nada.',
      })
    } else if (lectura === 'estancado') {
      out.push({
        musculo,
        lectura,
        mejora: m,
        propuesta: null,
        titulo: `${nombre}: igual que la vez anterior`,
        detalle:
          'No cambies de ejercicio: eso no arregla un estancamiento. Revisa la técnica en vídeo, que el RIR sea el que toca y que descansas lo que pide.' +
          (datos.definicion
            ? ' En definición también se progresa: no entres pensando que vas a rendir menos.'
            : ''),
      })
    } else {
      out.push({
        musculo,
        lectura,
        mejora: m,
        propuesta: null,
        titulo: `${nombre}: rindes peor en ${m.peores} de ${m.comparables} series`,
        detalle:
          'Antes de quitar series, revisa el sueño, el estrés y la comida.' +
          (datos.definicion
            ? ' En déficit el margen es más estrecho: comprueba que comes lo que marca tu plan.'
            : ''),
      })
    }
  }
  return out.sort((a, b) => orden[a.lectura] - orden[b.lectura])
}

/** El lunes de la semana de una fecha (AAAA-MM-DD): marca de lo ya visto cada semana. */
export function lunesDe(fecha: string): string {
  const dia = (new Date(`${fecha}T12:00:00`).getDay() + 6) % 7
  return addDays(fecha, -dia)
}
