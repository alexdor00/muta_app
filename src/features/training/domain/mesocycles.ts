// Mesociclos (prototipo: progreso/mesociclos.js): cada plan vive como un mesociclo; al empezar otro, el anterior se archiva
// con su rutina y sus fechas. Sus entrenos son los de sus fechas. Aquí, lo que se calcula con ellos: semanas, resumen,
// constancia, racha de semanas, series por músculo e intensidad (RIR). El balance y la comparación, en mesocycleReview.ts;
// los récords de cada grupo y el calendario, en groupRecords.ts.
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import { e1rm } from './e1rm.ts'
import type { MuscleId, Range } from './muscles.ts'
import { lunesDe } from './trainingProgress.ts'
import type { Entreno, EjercicioGuardado } from './workoutHistory.ts'
import type { SerieHecha } from './workoutSet.ts'

/** El objetivo de un mesociclo: tu fase (la de Nutrición, como la lee state/fase.ts) cuando empezó. */
export type Objetivo = 'bulk' | 'cut' | 'maintenance'

export const NOMBRE_OBJETIVO: Record<Objetivo, string> = {
  bulk: 'volumen',
  cut: 'definición',
  maintenance: 'mantenimiento',
}

/** La rutina tal como era en ese mesociclo (para verla después y para el RIR objetivo de cada ejercicio). */
export type SesionDelMeso = {
  sigla: string
  nombre: string
  ejercicios: { nombre: string; series: number; reps: string; rir: number }[]
}

export type Mesociclo = {
  id: string
  nombre: string
  /** AAAA-MM-DD; `fin` null en el que está en curso. */
  inicio: string
  fin: string | null
  objetivo: Objetivo | null
  /** El nombre de la rutina, su id y tu plan guardado tal cual (para volver a usarla). */
  rutina: string
  programId: string
  plan: unknown
  /** Sus sesiones (en el que está en curso, las de ahora: se ponen al leerlo). */
  sesiones: SesionDelMeso[]
  /** Sesiones de su semana (el objetivo de la constancia). */
  sesionesPorSemana: number
}

export const finDe = (m: Mesociclo, hoy: string) => m.fin ?? hoy

/** Semanas que dura: las de lunes a domingo que toca, de la de su inicio a la de su fin (o hoy). */
export function semanasQueDura(m: Mesociclo, hoy: string): number {
  return daysBetween(lunesDe(m.inicio), lunesDe(finDe(m, hoy))) / 7 + 1
}

/** Los entrenos de un mesociclo: los de sus fechas, en orden. */
export function entrenosDe(m: Mesociclo, entrenos: readonly Entreno[], hoy: string): Entreno[] {
  const fin = finDe(m, hoy)
  return entrenos.filter((x) => x.fecha >= m.inicio && x.fecha <= fin).sort((a, b) => a.inicio - b.inicio)
}

/** Series y kilos movidos de un ejercicio (con sus bajadas o mini-series). */
const seriesDe = (e: EjercicioGuardado) => e.series.filter((s) => s.reps > 0)
const kilos = (s: SerieHecha) => [s, ...(s.extra ?? [])].reduce((t, x) => t + (x.kg ?? 0) * x.reps, 0)
export const toneladasDe = (x: Entreno) =>
  x.ejercicios.reduce((t, e) => t + seriesDe(e).reduce((u, s) => u + kilos(s), 0), 0) / 1000
export const seriesDeEntreno = (x: Entreno) => x.ejercicios.reduce((t, e) => t + seriesDe(e).length, 0)

/** Mejor 1RM estimado de un ejercicio en un entreno (sin RIR, como las marcas; 0 si no hay series) y su serie. */
export function mejorDe(e: EjercicioGuardado): { valor: number; serie: SerieHecha | null } {
  let mejor = { valor: 0, serie: null as SerieHecha | null }
  for (const s of seriesDe(e)) {
    const v = e1rm(s.kg, s.reps, 0)
    if (v > mejor.valor) mejor = { valor: v, serie: s }
  }
  return mejor
}

export type Semana = {
  /** El lunes y el domingo. */
  lunes: string
  domingo: string
  numero: number
  entrenos: Entreno[]
  enCurso: boolean
}

/** Las semanas del mesociclo, de lunes a domingo, desde la de su inicio hasta la de su fin (o hoy). */
export function semanasDe(m: Mesociclo, entrenos: readonly Entreno[], hoy: string): Semana[] {
  const suyos = entrenosDe(m, entrenos, hoy)
  const ultima = lunesDe(finDe(m, hoy))
  const out: Semana[] = []
  for (let lunes = lunesDe(m.inicio), n = 1; lunes <= ultima && n < 400; lunes = addDays(lunes, 7), n++) {
    const domingo = addDays(lunes, 6)
    out.push({
      lunes,
      domingo,
      numero: n,
      entrenos: suyos.filter((x) => x.fecha >= lunes && x.fecha <= domingo),
      enCurso: !m.fin && hoy >= lunes && hoy <= domingo,
    })
  }
  return out
}

export type EjercicioDelMeso = {
  nombre: string
  primera: number
  primeraSerie: SerieHecha | null
  ultima: number
  ultimaSerie: SerieHecha | null
  mejor: number
  veces: number
  /** Cambio de la última vez frente a la primera, en tanto por uno. */
  cambio: number
  /** Veces seguidas, hasta la última, sin récord (>1 % sobre su mejor de antes; la primera vez de siempre no cuenta). */
  sinRecord: number
}

export type ResumenMeso = {
  sesiones: number
  series: number
  toneladas: number
  /** Récords: veces que un ejercicio supera en más de un 1 % su mejor 1RM estimado de antes (de cualquier mesociclo). */
  records: number
  ejercicios: EjercicioDelMeso[]
  /** Ejercicios hechos más de una vez, los que suben y los que bajan (la última vez frente a la primera, ±0,5 %). */
  suben: number
  bajan: number
  repetidos: number
}

export function resumenDe(m: Mesociclo, entrenos: readonly Entreno[], hoy: string): ResumenMeso {
  const suyos = new Set(entrenosDe(m, entrenos, hoy).map((x) => x.id))
  const mejores = new Map<string, number>()
  const porEjercicio = new Map<string, EjercicioDelMeso>()
  let records = 0
  for (const x of [...entrenos].sort((a, b) => a.inicio - b.inicio)) {
    const dentro = suyos.has(x.id)
    for (const e of x.ejercicios) {
      const { valor, serie } = mejorDe(e)
      if (!valor) continue
      if (dentro) {
        const o = porEjercicio.get(e.nombre)
        if (!o)
          porEjercicio.set(e.nombre, {
            nombre: e.nombre,
            primera: valor,
            primeraSerie: serie,
            ultima: valor,
            ultimaSerie: serie,
            mejor: valor,
            veces: 1,
            cambio: 0,
            sinRecord: 0,
          })
        else
          Object.assign(o, {
            ultima: valor,
            ultimaSerie: serie,
            mejor: Math.max(o.mejor, valor),
            veces: o.veces + 1,
          })
        const antes = mejores.get(e.nombre)
        const ej = porEjercicio.get(e.nombre)
        if (antes && valor > antes * 1.01) {
          records++
          if (ej) ej.sinRecord = 0
        } else if (antes && ej) ej.sinRecord++
      }
      mejores.set(e.nombre, Math.max(mejores.get(e.nombre) ?? 0, valor))
    }
  }
  const ejercicios = [...porEjercicio.values()]
    .map((o) => ({ ...o, cambio: o.primera ? o.ultima / o.primera - 1 : 0 }))
    .sort((a, b) => b.veces - a.veces || b.cambio - a.cambio)
  const lista = entrenos.filter((x) => suyos.has(x.id))
  return {
    sesiones: lista.length,
    series: lista.reduce((t, x) => t + seriesDeEntreno(x), 0),
    toneladas: lista.reduce((t, x) => t + toneladasDe(x), 0),
    records,
    ejercicios,
    suben: ejercicios.filter((x) => x.veces > 1 && x.cambio > 0.005).length,
    bajan: ejercicios.filter((x) => x.veces > 1 && x.cambio < -0.005).length,
    repetidos: ejercicios.filter((x) => x.veces > 1).length,
  }
}

/** La semana en la que vas (1 = la primera) en el que está en curso; en uno archivado, las que duró. */
export function semanaActual(m: Mesociclo, hoy: string): number {
  const total = semanasQueDura(m, hoy)
  if (m.fin) return total
  return Math.min(total, Math.floor(daysBetween(lunesDe(m.inicio), lunesDe(hoy)) / 7) + 1)
}

export type Constancia = {
  /** Sesiones hechas (sin pasar de las planificadas por semana) de las planificadas hasta hoy; pct null sin semanas. */
  hechas: number
  planificadas: number
  pct: number | null
  veredicto: string
}

/** Constancia: en el que está en curso, la semana actual no cuenta (aún no ha terminado) si hay otras. */
export function constanciaDe(semanas: readonly Semana[], porSemana: number): Constancia {
  const cuentan = semanas.length > 1 && semanas.at(-1)?.enCurso ? semanas.slice(0, -1) : semanas
  const hechas = cuentan.reduce((t, w) => t + Math.min(w.entrenos.length, porSemana), 0)
  const planificadas = cuentan.length * porSemana
  const pct = planificadas ? Math.round((hechas / planificadas) * 100) : null
  const veredicto = pct === null ? '' : pct >= 85 ? 'Muy constante' : pct >= 60 ? 'Constante' : 'Irregular'
  return { hechas, planificadas, pct, veredicto }
}

/**
 * La constancia de cada mes (AAAA-MM) de un mesociclo, con la misma regla: cada semana cuenta en el mes de su jueves (como el
 * calendario ISO), así ninguna se cuenta dos veces.
 */
export function constanciaPorMes(semanas: readonly Semana[], porSemana: number): Record<string, Constancia> {
  const porMes = new Map<string, Semana[]>()
  for (const w of semanas) {
    const mes = addDays(w.lunes, 3).slice(0, 7)
    porMes.set(mes, [...(porMes.get(mes) ?? []), w])
  }
  return Object.fromEntries([...porMes].map(([mes, ws]) => [mes, constanciaDe(ws, porSemana)]))
}

/**
 * Racha: semanas seguidas con las sesiones planificadas o más. La actual cuenta si ya está cumplida; sin cumplir, no
 * la rompe. No va más atrás de `desde`.
 */
export function rachaDeSemanas(
  entrenos: readonly Entreno[],
  porSemana: number,
  hoy: string,
  desde: string,
): number {
  if (porSemana < 1) return 0
  const deSemana = (lunes: string) =>
    entrenos.filter((x) => x.fecha >= lunes && x.fecha <= addDays(lunes, 6)).length
  let lunes = lunesDe(hoy)
  let racha = deSemana(lunes) >= porSemana ? 1 : 0
  const tope = lunesDe(desde)
  for (lunes = addDays(lunes, -7); lunes >= tope && racha < 520; lunes = addDays(lunes, -7)) {
    if (deSemana(lunes) >= porSemana) racha++
    else break
  }
  return racha
}

/** Lo que suma un ejercicio a cada músculo: 1 directa, 0,5 indirecta (la biblioteca lo sabe). */
export type Aportes = (nombre: string) => Partial<Record<MuscleId, number>> | null

export type MusculoDelMeso = {
  musculo: MuscleId
  /** Medias por semana: series directas, veces y series indirectas. */
  series: number
  veces: number
  indirectas: number
  rango: Range
  estado: 'bajo' | 'ok' | 'alto' | 'indirecto'
}

/** Grupos de la pestaña Músculos. */
export const GRUPOS_MUSCULOS: [string, MuscleId[]][] = [
  ['Torso', ['pecho', 'dorsal', 'espalda_alta', 'hombro_ant', 'hombro_lat', 'hombro_post']],
  ['Brazos', ['biceps', 'triceps', 'antebrazo']],
  ['Piernas', ['cuadriceps', 'femoral', 'gluteo', 'aductores', 'gemelo']],
  ['Core y cuello', ['core', 'cuello']],
]

export function estadoDeVolumen(valor: number, [lo, hi]: Range): 'bajo' | 'ok' | 'alto' {
  if (valor < lo - 0.01) return 'bajo'
  if (valor > hi + 0.01) return 'alto'
  return 'ok'
}

/**
 * Series directas por semana de cada músculo frente a su rango (las indirectas, aparte: no suman). Solo semanas con
 * entrenos; la semana en curso no cuenta si hay otras. null si no hay entrenos.
 */
export function musculosDe(
  semanas: readonly Semana[],
  aportes: Aportes,
  rangoDe: (m: MuscleId) => Range,
): MusculoDelMeso[] | null {
  const conEntrenos = semanas.filter((w) => w.entrenos.length)
  if (!conEntrenos.length) return null
  const porSemana = conEntrenos.map((w) => {
    const series: Partial<Record<MuscleId, number>> = {}
    const indirectas: Partial<Record<MuscleId, number>> = {}
    const veces: Partial<Record<MuscleId, number>> = {}
    for (const x of w.entrenos) {
      const tocados = new Set<MuscleId>()
      for (const e of x.ejercicios) {
        const n = seriesDe(e).length
        const a = aportes(e.nombre) ?? (e.musculo ? { [e.musculo]: 1 } : null)
        if (!n || !a) continue
        for (const [m, c] of Object.entries(a) as [MuscleId, number][]) {
          if (c >= 1) {
            series[m] = (series[m] ?? 0) + n
            tocados.add(m)
          } else if (c >= 0.5) indirectas[m] = (indirectas[m] ?? 0) + n
        }
      }
      tocados.forEach((m) => (veces[m] = (veces[m] ?? 0) + 1))
    }
    return { series, indirectas, veces }
  })
  const cuentan = porSemana.length > 1 && conEntrenos.at(-1)?.enCurso ? porSemana.slice(0, -1) : porSemana
  const media = (k: 'series' | 'indirectas' | 'veces', m: MuscleId) =>
    cuentan.reduce((t, w) => t + (w[k][m] ?? 0), 0) / cuentan.length
  return GRUPOS_MUSCULOS.flatMap(([, ids]) => ids).map((musculo) => {
    const series = media('series', musculo)
    const indirectas = media('indirectas', musculo)
    const rango = rangoDe(musculo)
    let estado: MusculoDelMeso['estado'] = estadoDeVolumen(series, rango)
    if (estado === 'bajo' && !series && indirectas >= rango[0]) estado = 'indirecto'
    return { musculo, series, veces: media('veces', musculo), indirectas, rango, estado }
  })
}
