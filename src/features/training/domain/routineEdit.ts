// Editar rutina (A11–A13): lo que cambias en cada sesión de tu plan (orden, quitar, añadir y la pauta de cada ejercicio).
// Se guarda aparte (la rutina original no se toca) y vale para todas las semanas. Los ejercicios se reconocen por su nombre
// en la rutina (si lo cambiaste por otro, por el de la rutina).
import { formatRange } from '../../../shared/lib/format.ts'
import type { LibraryExercise } from './exerciseLibrary.ts'
import { sessionMinutes } from './programInfo.ts'
import { ejercicioDelPlan, type EjercicioPlan, type SesionPlan } from './workoutPlan.ts'

/** Lo que cambias de la pauta de un ejercicio. */
export type PautaEditada = {
  series?: number
  reps?: [number, number]
  rir?: number
  salto?: number
  nota?: string
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

const conPauta = (e: EjercicioPlan, p: PautaEditada | undefined): EjercicioPlan =>
  p
    ? {
        ...e,
        ...(p.series ? { series: p.series } : {}),
        ...(p.reps ? { reps: formatRange(p.reps) } : {}),
        ...(p.rir !== undefined ? { rir: p.rir } : {}),
        ...(p.salto ? { salto: p.salto } : {}),
        ...(p.nota ? { nota: p.nota } : {}),
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
export function pautaDe(e: EjercicioPlan): Required<Omit<PautaEditada, 'nota'>> & { nota: string } {
  const [a, b = a] = e.reps.split('–').map((x) => parseInt(x, 10))
  return {
    series: e.series,
    reps: [Number.isFinite(a) ? a : 8, Number.isFinite(b) ? b : 12],
    rir: e.rir,
    salto: e.salto,
    nota: e.nota ?? '',
  }
}
