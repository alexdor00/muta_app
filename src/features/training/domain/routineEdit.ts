// Editar rutina (A11–A13): lo que cambias en cada sesión de tu plan (orden, quitar, añadir y la pauta de cada ejercicio).
// Se guarda aparte (la rutina original no se toca) y vale para todas las semanas. Los ejercicios se reconocen por su nombre
// en la rutina (si lo cambiaste por otro, por el de la rutina).
import { formatRange } from '../../../shared/lib/format.ts'
import type { LibraryExercise } from './exerciseLibrary.ts'
import { sessionMinutes } from './programInfo.ts'
import { ejercicioDelPlan, type EjercicioPlan, type SesionPlan, type Tecnica } from './workoutPlan.ts'

/** Lo que cambias de la pauta de un ejercicio. */
export type PautaEditada = {
  series?: number
  reps?: [number, number]
  rir?: number
  salto?: number
  nota?: string
  /** Cada serie distinta: su rango, serie a serie (null: todas iguales otra vez). */
  repsSerie?: [number, number][] | null
  /** Superserie con el ejercicio de esa clave, o con ninguno (null). */
  superserie?: string | null
  /** Técnica de intensidad que le pones (null: ninguna, aunque la rutina traiga una). */
  tecnica?: Tecnica | null
}

/** Un ejercicio que añades a una sesión. */
export type Anadido = {
  nombre: string
  series: number
  reps: [number, number]
  rir: number
  descanso: number
}

export type EdicionSesion = {
  /** El orden, por clave de ejercicio (los que no están, detrás en su orden). */
  orden?: string[]
  quitados?: string[]
  anadidos?: Anadido[]
  pauta?: Record<string, PautaEditada>
}

/** Las ediciones de tu plan, por sigla de sesión. */
export type Ediciones = Record<string, EdicionSesion>

/** Cómo se reconoce un ejercicio de la sesión: su nombre en la rutina (el de antes si lo cambiaste por otro). */
export const claveDe = (e: Pick<EjercicioPlan, 'nombre' | 'enLugarDe'>) => e.enLugarDe ?? e.nombre

/** Cada serie distinta: la lista («4», «6–8») y, como `reps`, el rango de todas. */
function conSeries(rangos: [number, number][]): Pick<EjercicioPlan, 'repsSerie' | 'reps'> {
  const [a, b] = [Math.min(...rangos.map((r) => r[0])), Math.max(...rangos.map((r) => r[1]))]
  return { repsSerie: rangos.map(formatRange), reps: formatRange([a, b]) }
}

const conPauta = (e: EjercicioPlan, p: PautaEditada | undefined): EjercicioPlan =>
  p
    ? {
        ...e,
        ...(p.series ? { series: p.series } : {}),
        ...(p.reps ? { reps: formatRange(p.reps) } : {}),
        ...(p.rir !== undefined ? { rir: p.rir } : {}),
        ...(p.salto ? { salto: p.salto } : {}),
        ...(p.nota ? { nota: p.nota } : {}),
        ...(p.repsSerie === null ? { repsSerie: undefined } : {}),
        ...(p.repsSerie ? conSeries(p.repsSerie) : {}),
        ...(p.superserie !== undefined ? { superserieCon: p.superserie } : {}),
        ...(p.tecnica !== undefined ? { tecnica: p.tecnica ?? undefined } : {}),
        sugeridos: e.sugeridos.filter(
          (s) => !(s === 'series' && p.series) && !(s === 'reps' && p.reps) && !(s === 'salto' && p.salto),
        ),
      }
    : e

/** La sesión con tus ediciones: sin lo quitado, con lo añadido detrás, con tu pauta y en tu orden. */
export function aplicarEdicion(
  s: SesionPlan,
  ed: EdicionSesion | undefined,
  biblioteca: (nombre: string) => LibraryExercise | null,
): SesionPlan {
  if (!ed) return s
  const quitados = new Set(ed.quitados ?? [])
  const anadidos = (ed.anadidos ?? []).map((a) => ({
    ...ejercicioDelPlan({ name: a.nombre, sets: a.series }, biblioteca(a.nombre)),
    reps: formatRange(a.reps),
    rir: a.rir,
    descanso: a.descanso,
    anadido: true,
  }))
  const todos = [...s.ejercicios.filter((e) => !quitados.has(claveDe(e))), ...anadidos].map((e) =>
    conPauta(e, ed.pauta?.[claveDe(e)]),
  )
  const puesto = (e: EjercicioPlan) => {
    const i = (ed.orden ?? []).indexOf(claveDe(e))
    return i < 0 ? Number.MAX_SAFE_INTEGER : i
  }
  const ejercicios = todos
    .map((e, i) => ({ e, i }))
    .sort((a, b) => puesto(a.e) - puesto(b.e) || a.i - b.i)
    .map(({ e }) => e)
  const minutos =
    Math.round(
      sessionMinutes(
        ejercicios.map((e) => ({ name: e.nombre, sets: e.series, rest: `${e.descanso / 60} min` })),
      ) / 5,
    ) * 5
  return { ...s, ejercicios, minutos }
}

/** ¿Van unidos en superserie el ejercicio `i` y el siguiente? Lo que elegiste manda; si no, la misma letra de la rutina. */
function unidos(a: EjercicioPlan, b: EjercicioPlan): boolean {
  if (a.superserieCon !== undefined || b.superserieCon !== undefined)
    return a.superserieCon === claveDe(b) || b.superserieCon === claveDe(a)
  return Boolean(a.superserie) && a.superserie === b.superserie
}

/**
 * Las superseries de una sesión, en su orden: de cada ejercicio, los de su grupo (posiciones, en orden) o null si va solo.
 * Un grupo son ejercicios seguidos unidos (A1 y A2 de la rutina, o los que unes tú).
 */
export function superseries(ejercicios: readonly EjercicioPlan[]): (number[] | null)[] {
  const grupos: (number[] | null)[] = ejercicios.map(() => null)
  let actual: number[] = []
  ejercicios.forEach((e, i) => {
    if (actual.length === 0) actual = [i]
    if (i + 1 < ejercicios.length && unidos(e, ejercicios[i + 1])) actual.push(i + 1)
    else {
      if (actual.length > 1) for (const k of actual) grupos[k] = actual
      actual = []
    }
  })
  return grupos
}

/** Superserie con el de al lado: ninguno, el anterior o el siguiente. */
export type Superserie = 'ninguno' | 'anterior' | 'siguiente'

/** «Superserie con» del ejercicio `i`: las opciones (ninguno y los de al lado, por su nombre) y la que vale ahora. */
export function superserieDe(ejercicios: readonly EjercicioPlan[], i: number) {
  const [antes, despues] = [ejercicios[i - 1], ejercicios[i + 1]]
  const g = superseries(ejercicios)[i] ?? []
  const valor: Superserie = g.includes(i + 1) ? 'siguiente' : g.includes(i - 1) ? 'anterior' : 'ninguno'
  return {
    opciones: [
      { value: 'ninguno' as Superserie, label: 'Ninguno' },
      ...(antes ? [{ value: 'anterior' as Superserie, label: `Con ${antes.nombre}` }] : []),
      ...(despues ? [{ value: 'siguiente' as Superserie, label: `Con ${despues.nombre}` }] : []),
    ],
    valor,
  }
}

/** Une el ejercicio `i` con el de al lado o lo deja solo (y deshace lo que los de al lado tuvieran con él). */
export function unirEnSuperserie(
  ed: EdicionSesion,
  ejercicios: readonly EjercicioPlan[],
  i: number,
  v: Superserie,
): EdicionSesion {
  const x = ejercicios[i]
  const [antes, despues] = [ejercicios[i - 1], ejercicios[i + 1]]
  if (v === 'siguiente' && despues) return cambiarPauta(ed, claveDe(x), { superserie: claveDe(despues) })
  if (v === 'anterior' && antes) return cambiarPauta(ed, claveDe(x), { superserie: claveDe(antes) })
  let r = cambiarPauta(ed, claveDe(x), { superserie: null })
  for (const otro of [antes, despues])
    if (otro && otro.superserieCon === claveDe(x)) r = cambiarPauta(r, claveDe(otro), { superserie: null })
  return r
}

/** Mueve el ejercicio del puesto `de` al puesto `a` (sobre la lista que se ve). */
export function mover(
  ed: EdicionSesion,
  ejercicios: readonly EjercicioPlan[],
  de: number,
  a: number,
): EdicionSesion {
  const claves = ejercicios.map(claveDe)
  const [k] = claves.splice(de, 1)
  claves.splice(a, 0, k)
  return { ...ed, orden: claves }
}

export const quitar = (ed: EdicionSesion, clave: string): EdicionSesion => {
  const anadido = (ed.anadidos ?? []).some((x) => x.nombre === clave)
  return anadido
    ? { ...ed, anadidos: (ed.anadidos ?? []).filter((x) => x.nombre !== clave) }
    : { ...ed, quitados: [...(ed.quitados ?? []), clave] }
}

/** Añadir (no repite uno que ya está en la sesión). */
export const anadir = (ed: EdicionSesion, a: Anadido, enLaSesion: readonly string[]): EdicionSesion =>
  enLaSesion.includes(a.nombre) ? ed : { ...ed, anadidos: [...(ed.anadidos ?? []), a] }

export const cambiarPauta = (ed: EdicionSesion, clave: string, p: PautaEditada): EdicionSesion => ({
  ...ed,
  pauta: { ...ed.pauta, [clave]: { ...ed.pauta?.[clave], ...p } },
})

/** La pauta de un ejercicio, para editarla: lo que tiene ahora. */
export function pautaDe(
  e: EjercicioPlan,
): Required<Omit<PautaEditada, 'nota' | 'repsSerie' | 'superserie' | 'tecnica'>> & { nota: string } {
  const [a, b = a] = e.reps.split('–').map((x) => parseInt(x, 10))
  return {
    series: e.series,
    reps: [Number.isFinite(a) ? a : 8, Number.isFinite(b) ? b : 12],
    rir: e.rir,
    salto: e.salto,
    nota: e.nota ?? '',
  }
}
