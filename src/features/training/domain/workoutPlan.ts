// Tu plan de verdad: las sesiones de la semana que toca de la rutina guardada, con lo que la sesión necesita de cada
// ejercicio. Lo que trae la rutina manda; lo que falta sale de la biblioteca y, si tampoco está, se rellena y se marca
// como sugerido (decisión 2026-11-03).
import { formatClock, formatDecimal, formatRange } from '../../../shared/lib/format.ts'
import { effortLabel } from './effort.ts'
import type { LibraryExercise } from './exerciseLibrary.ts'
import { muscleOf } from './muscleOf.ts'
import type { MuscleId, Range } from './muscles.ts'
import { restMinutes, sessionMinutes } from './programInfo.ts'
import { suggestFor, type Sugerencia } from './progression.ts'
import { isSession, type Exercise, type ProgramData, type Session } from './program.ts'
import type { SerieHecha } from './workoutSet.ts'

/** Lo que se rellena porque no viene ni en la rutina ni en la biblioteca. */
export type Sugerido = 'series' | 'reps' | 'rir' | 'descanso' | 'musculo' | 'salto'

/** Un ejercicio de una sesión: series, rango de repeticiones, esfuerzo, descanso y lo que pide el calentamiento. */
export type EjercicioPlan = {
  nombre: string
  series: number
  /** «6–10», «12» o «AMRAP», con raya. */
  reps: string
  /** RIR: repeticiones que quedan al acabar la serie (0 = al fallo). */
  rir: number
  /** Kilos y repeticiones de cada serie la última vez (vacío la primera vez). */
  ultima: SerieHecha[]
  /** Descanso entre series, en segundos. */
  descanso: number
  /** Músculo principal (null si no se sabe), los que también trabajan y si es básico. */
  musculo: MuscleId | null
  secundarios: MuscleId[]
  compuesto: boolean
  pesoCorporal?: boolean
  /** Salto de peso (2,5 kg en barra y máquina, 2 kg en mancuernas). */
  salto: number
  /** Con qué se puede cambiar hoy: los sustitutos que da el programa. */
  sustitutos: string[]
  sugeridos: Sugerido[]
  /** El nombre original (inglés) que trae la rutina, si lo trae: ayuda a saber qué trabaja. */
  original?: string
  /** La explicación del documento de la rutina para este ejercicio (traducida), si la trae. */
  explicacion?: string
  /** Tu nota del ejercicio (Editar rutina). */
  nota?: string
  /** Lo añadiste tú en Editar rutina (no está en la rutina). */
  anadido?: boolean
  /** Si en tu plan lo cambiaste por este: el de la rutina («En lugar de …»). */
  enLugarDe?: string
}

export type SesionPlan = { sigla: string; nombre: string; minutos: number; ejercicios: EjercicioPlan[] }

/** Dónde vas en la rutina: fase (bloque), semana dentro de ella y la siguiente sesión de esa semana. */
export type Rotacion = { bloque: number; semana: number; siguiente: number }

export const INICIO: Rotacion = { bloque: 0, semana: 0, siguiente: 0 }

/** Lo que se pone cuando falta (sugerido): 3 series, 8–12 reps, a 2 del fallo y 2,5 kg; el descanso, por tipo (restMinutes). */
const RELLENO = { series: 3, reps: '8–12', rir: 2, salto: 2.5 }

/** «A1 · Cuádriceps y espalda» → A1; si el nombre no trae sigla, S y su puesto en la semana («S2»). */
export function siglaYNombre(nombre: string, puesto: number): { sigla: string; nombre: string } {
  const m = /^([A-Z]\d{1,2})\s*·\s*(.+)$/.exec(nombre)
  return m ? { sigla: m[1], nombre: m[2] } : { sigla: `S${puesto + 1}`, nombre }
}

/** El nombre de cada sesión; si dos se llaman igual («Torso» y «Torso»), con su número: «Torso 1», «Torso 2». */
export function nombresDeSesiones(lista: { sigla: string; nombre: string }[]): Record<string, string> {
  const vistas: Record<string, number> = {}
  return Object.fromEntries(
    lista.map((s) => {
      const repetido = lista.filter((x) => x.nombre === s.nombre).length > 1
      vistas[s.nombre] = (vistas[s.nombre] ?? 0) + 1
      return [s.sigla, repetido ? `${s.nombre} ${vistas[s.nombre]}` : s.nombre]
    }),
  )
}

/** «2-3», «2each», 4 → el primer número; null si no hay. */
export function seriesDe(sets: Exercise['sets']): number | null {
  if (typeof sets === 'number') return sets > 0 ? sets : null
  const n = parseInt(sets ?? '', 10)
  return n > 0 ? n : null
}

/** «10-12 (dropset)» → «10–12 (dropset)»; vacío o «N/A», null. */
export function repsDe(reps: Exercise['reps']): string | null {
  const t = (reps ?? '').trim()
  return t && !/^n\/a$/i.test(t) ? t.replace(/(\d)\s*-\s*(\d)/g, '$1–$2') : null
}

/**
 * El RIR de una serie desde el RPE del documento (RIR = 10 − RPE): con varios números («8-9», «~9 → 10», «9, 9, 10»)
 * vale el más alto, el esfuerzo al que hay que llegar. Sin número o fuera de escala, null.
 */
export function rirDe(rpe: Exercise['rpe']): number | null {
  const nums = [...(rpe ?? '').matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')))
  if (!nums.length || nums.some((n) => n > 10)) return null
  return Math.max(0, Math.round(10 - Math.max(...nums)))
}

/** Segundos de descanso del texto del documento (restMinutes: el medio de un rango, hasta 5 min); sin número, null. */
export function descansoDe(rest: Exercise['rest']): number | null {
  return /\d/.test(rest ?? '') ? Math.round(restMinutes(rest) * 60) : null
}

/** Un ejercicio de la rutina con lo que pide la sesión: de la rutina, de la biblioteca o sugerido. */
export function ejercicioDelPlan(e: Exercise, lib: LibraryExercise | null): EjercicioPlan {
  const sugeridos: Sugerido[] = []
  const o = <T>(valor: T | null | undefined, deBiblioteca: T | undefined, relleno: T, campo: Sugerido): T => {
    if (valor != null) return valor
    if (deBiblioteca !== undefined) return deBiblioteca
    sugeridos.push(campo)
    return relleno
  }
  const musculo = lib?.primary ?? muscleOf(e)
  if (!musculo) sugeridos.push('musculo')
  return {
    nombre: e.slot?.kind === 'optional' && e.slot.chosen ? e.slot.chosen : e.name,
    series: o(seriesDe(e.sets), undefined, RELLENO.series, 'series'),
    reps: o(repsDe(e.reps), lib ? formatRange(lib.reps) : undefined, RELLENO.reps, 'reps'),
    rir: o(rirDe(e.rpe), lib?.rir, RELLENO.rir, 'rir'),
    ultima: [],
    descanso: o(descansoDe(e.rest), lib?.restSec, Math.round(restMinutes(null, e.kind) * 60), 'descanso'),
    musculo,
    secundarios: lib
      ? (Object.entries(lib.contributes) as [MuscleId, number][])
          .filter(([m, c]) => m !== lib.primary && c >= 0.5)
          .map(([m]) => m)
      : [],
    compuesto: lib ? lib.kind === 'compound' : e.kind !== 'isolation',
    pesoCorporal: lib?.equipment === 'bodyweight',
    salto: o(null, lib?.stepKg, RELLENO.salto, 'salto'),
    sustitutos: e.substitutions ?? [],
    ...(e.originalName && e.originalName !== e.name ? { original: e.originalName } : {}),
    ...(e.tip ? { explicacion: e.tip } : {}),
    sugeridos,
  }
}

/** Lo que se hace de una sesión: sin lo quitado ni lo apagado y, de cada grupo de progresión, solo el primero. */
function hechos(s: Session): Exercise[] {
  return s.exercises.filter(
    (e, i) =>
      !e.removed &&
      !(e.slot?.kind === 'optional' && e.slot.off) &&
      !((e.slot?.kind === 'weak' || e.slot?.kind === 'pick') && !e.slot.filled) &&
      (!e.group || s.exercises.findIndex((x) => x.group === e.group) === i),
  )
}

/**
 * Lo que cambiaste en tu plan (nombre en la rutina → el que lo sustituye): el nuevo con la pauta de la rutina (series,
 * repeticiones, esfuerzo y descanso); lo demás (músculo, salto…), del nuevo.
 */
function conCambio(
  e: Exercise,
  cambios: Readonly<Record<string, string>>,
): Exercise & { enLugarDe?: string } {
  const nuevo = cambios[e.name]
  if (!nuevo) return e
  return { ...e, name: nuevo, originalName: undefined, muscle: undefined, kind: undefined, enLugarDe: e.name }
}

/**
 * Las sesiones de una semana del programa (sin los días de descanso), con la biblioteca para lo que falta y lo que
 * cambiaste en tu plan.
 */
export function sesionesDeSemana(
  program: ProgramData,
  rot: Rotacion,
  biblioteca: (nombre: string) => LibraryExercise | null,
  cambios: Readonly<Record<string, string>> = {},
): SesionPlan[] {
  const semana = program.blocks[rot.bloque]?.weeks[rot.semana]
  if (!semana) return []
  return semana.days.filter(isSession).map((s, i) => {
    const ejercicios = hechos(s).map((original) => {
      const e = conCambio(original, cambios)
      const plan = ejercicioDelPlan(e, biblioteca(e.name))
      return e.enLugarDe ? { ...plan, enLugarDe: e.enLugarDe } : plan
    })
    return { ...siglaYNombre(s.name, i), minutos: Math.round(sessionMinutes(hechos(s)) / 5) * 5, ejercicios }
  })
}

/** Cuántas sesiones tiene una semana (0 si no existe). */
const sesionesEn = (program: ProgramData, bloque: number, semana: number) =>
  program.blocks[bloque]?.weeks[semana]?.days.filter(isSession).length ?? 0

/**
 * Tras terminar la sesión `hecha` de la semana: toca la siguiente; si era la última, la semana siguiente (o la
 * primera de la fase siguiente); tras la última de todo, se vuelve a empezar (decisión 2026-11-03: la semana pasa al
 * completarla, no por calendario).
 */
export function avanzar(program: ProgramData, rot: Rotacion, hecha: number): Rotacion {
  if (hecha + 1 < sesionesEn(program, rot.bloque, rot.semana)) return { ...rot, siguiente: hecha + 1 }
  if (rot.semana + 1 < (program.blocks[rot.bloque]?.weeks.length ?? 0))
    return { bloque: rot.bloque, semana: rot.semana + 1, siguiente: 0 }
  if (rot.bloque + 1 < program.blocks.length) return { bloque: rot.bloque + 1, semana: 0, siguiente: 0 }
  return INICIO
}

/** «Fase 1 · semana 3 de 6», o solo «Semana 3 de 6» si la rutina tiene una fase. */
export function dondeVas(program: ProgramData, rot: Rotacion): string {
  const semanas = program.blocks[rot.bloque]?.weeks.length ?? 0
  const semana = `semana ${rot.semana + 1} de ${semanas}`
  return program.blocks.length > 1
    ? `Fase ${rot.bloque + 1} · ${semana}`
    : semana.charAt(0).toUpperCase() + semana.slice(1)
}

/** «6–10» → [6, 10]; «12» → [12, 12]; si no se entiende, null. */
export function rangoDe(texto: string): Range | null {
  const [a, b = a] = texto.split(/[–\s]/).map(Number)
  return Number.isFinite(a) && Number.isFinite(b) && a > 0 ? [a, b] : null
}

/** Lo que toca hoy en la serie `i` según el motor (doble progresión desde la última vez). */
export function sugerenciaDe(e: EjercicioPlan, i = 0): Sugerencia {
  const minimo = parseInt(e.reps, 10) || 1
  return suggestFor(
    {
      ultima: e.ultima.map((s) => ({ ...s, rir: null })),
      rango: rangoDe(e.reps) ?? [minimo, minimo],
      rir: e.rir,
      salto: e.salto,
      pesoCorporal: e.pesoCorporal,
    },
    i,
  )
}

/** Los kilos de hoy de la serie `i` (null con peso corporal o si es la primera vez). */
export const kilosDeHoy = (e: EjercicioPlan, i = 0) => sugerenciaDe(e, i).kg

/**
 * Un ejercicio de la biblioteca para añadirlo hoy a la sesión (entreno.js · add-ex-session del prototipo): 3 series y lo
 * demás de la biblioteca, sin vez anterior ni sustitutos.
 */
export const desdeBiblioteca = (ex: LibraryExercise): EjercicioPlan =>
  ejercicioDelPlan({ name: ex.name, sets: 3 }, ex)

/**
 * Lo que se ha rellenado porque no lo dice la rutina, con su valor, para enseñarlo: «Sugerido, no lo dice la rutina:
 * 3 series, salto de 2,5 kg». Null si todo viene de la rutina o de la biblioteca. El músculo no se dice: si no se
 * sabe, no se rellena.
 */
export function notaSugerido(e: EjercicioPlan): string | null {
  const partes = e.sugeridos.flatMap((s) => {
    if (s === 'series') return [`${e.series} series`]
    if (s === 'reps') return [`${e.reps} reps`]
    if (s === 'rir') return [effortLabel(e.rir)]
    if (s === 'descanso') return [`descanso ${formatClock(e.descanso)}`]
    if (s === 'salto') return [`salto de ${formatDecimal(e.salto)} kg`]
    return []
  })
  return partes.length ? `Sugerido, no lo dice la rutina: ${partes.join(', ')}` : null
}

/**
 * Cómo pauta tu rutina un ejercicio en cualquiera de sus semanas (`esEste` dice si un nombre es ese ejercicio): las
 * repeticiones y el esfuerzo que más se repiten. null si la rutina no lo lleva o no dice repeticiones.
 */
export function pautaEnPrograma(
  program: ProgramData,
  esEste: (nombre: string) => boolean,
): { reps: Range; rir: number | null } | null {
  const reps = new Map<string, number>()
  const rpe = new Map<string, number>()
  for (const b of program.blocks)
    for (const w of b.weeks)
      for (const d of w.days.filter(isSession))
        for (const e of d.exercises) {
          if (!esEste(e.name)) continue
          const r = repsDe(e.reps)
          if (r) reps.set(r, (reps.get(r) ?? 0) + 1)
          if (e.rpe) rpe.set(e.rpe, (rpe.get(e.rpe) ?? 0) + 1)
        }
  const masUsado = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const rango = rangoDe(masUsado(reps) ?? '')
  if (!rango) return null
  const r = masUsado(rpe)
  return { reps: rango, rir: r ? rirDe(r) : null }
}
