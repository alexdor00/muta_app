import { effect } from '@preact/signals'
import { getDb } from '../../../shared/data/db.ts'
import { WORKOUT_STATUS } from '../../../shared/data/schema.ts'
import { localDate, parseDecimal } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { CATALOG, sourceOf, type Level } from '../domain/catalog.ts'
import type { MuscleId } from '../domain/muscles.ts'
import { applyChoices } from '../domain/planProgram.ts'
import type { PriorityChoice } from '../domain/priorities.ts'
import type { ProgramData } from '../domain/program.ts'
import { selectVariant } from '../domain/programInfo.ts'
import type { WeakChoice } from '../domain/weakPoints.ts'
import type { Entreno } from '../domain/workoutHistory.ts'
import { avanzar, dondeVas, INICIO, sesionesDeSemana, type Rotacion } from '../domain/workoutPlan.ts'
import { elecciones, type EleccionMusculo } from '../state/musculos.ts'
import { entrenos, tuPlan } from '../state/plan.ts'
import {
  descansosElegidos,
  ejerciciosDe,
  nombreHoy,
  segundosSesion,
  sesionEnCurso,
  type SesionEnCurso,
} from '../state/sesionEnCurso.ts'
import { porNombre } from './exerciseLibrary.ts'
import { LEVELS } from './loadRoutines.ts'
import { BUILT_IN } from './routineDetail.ts'

/** El plan guardado (`plans/current`): la rutina con tus elecciones y lo que cambias desde la sesión y las fichas. */
type PlanGuardado = {
  id: 'current'
  programId: string
  weakPoints?: WeakChoice | null
  priorities?: PriorityChoice | null
  /** Descanso elegido por ejercicio (segundos), para todas las sesiones. */
  descansos?: Record<string, number>
  /** Mantener · Desarrollar · Prioridad o a mano, por músculo. */
  musculos?: Partial<Record<MuscleId, EleccionMusculo>>
}

type RotacionGuardada = Rotacion & { id: 'current'; programId: string }

/** En `workouts`: un entreno terminado o, con este id, la sesión en curso. */
const EN_CURSO = 'en-curso'
type FilaEntreno =
  | (Entreno & { date: string; status: typeof WORKOUT_STATUS.finished })
  | { id: typeof EN_CURSO; date: string; status: typeof WORKOUT_STATUS.inProgress; sesion: SesionEnCurso }

/** El programa con tus elecciones (para avanzar la rotación al terminar). */
let programa: ProgramData | null = null
let carga: Promise<void> | null = null
/** El último entreno guardado y la rotación de antes, para «Me faltó un ejercicio». */
let ultimoGuardado: { id: string; rotacion: Rotacion } | null = null

/** Carga tu plan, tus entrenos y la sesión en curso (una vez; `forzar` tras cambiar de rutina). */
export function cargarPlan(forzar = false): Promise<void> {
  if (!carga || forzar) carga = leer()
  return carga
}

async function leer(): Promise<void> {
  try {
    const db = await getDb()
    const plan = (await db.get('plans', 'current')) as PlanGuardado | undefined
    const entry = plan && CATALOG.find((e) => e.id === plan.programId)
    const raw =
      entry &&
      ((BUILT_IN[sourceOf(entry)] ?? (await db.get('programs', sourceOf(entry)))) as ProgramData | undefined)
    if (!plan || !entry || !raw) {
      programa = null
      tuPlan.value = { status: 'none' }
      return
    }
    const perfil = (await db.get('profile', 'me')) as { level?: string } | undefined
    const nivel = LEVELS.find((l) => l === perfil?.level) ?? ('intermediate' satisfies Level)
    programa = applyChoices(
      selectVariant(raw, entry.variant),
      { weakPoints: plan.weakPoints ?? null, priorities: plan.priorities ?? null },
      nivel,
    )
    const guardada = (await db.get('rotation', 'current')) as RotacionGuardada | undefined
    const rotacion: Rotacion =
      guardada?.programId === plan.programId && programa.blocks[guardada.bloque]?.weeks[guardada.semana]
        ? { bloque: guardada.bloque, semana: guardada.semana, siguiente: guardada.siguiente }
        : INICIO
    const filas = (await db.getAll('workouts')) as FilaEntreno[]
    entrenos.value = filas.flatMap((f) => (f.status === WORKOUT_STATUS.finished ? [aEntreno(f)] : []))
    descansosElegidos.value = plan.descansos ?? {}
    elecciones.value = plan.musculos ?? {}
    ponerPlan(plan.programId, entry.title, nivel, rotacion)
    const enCurso = filas.find((f) => f.id === EN_CURSO)
    if (enCurso && 'sesion' in enCurso && !sesionEnCurso.value) sesionEnCurso.value = enCurso.sesion
    vigilar()
  } catch (error) {
    logError(error, 'cargar el plan')
    tuPlan.value = { status: 'none' }
  }
}

/** Una fila guardada sin los campos de la base. */
function aEntreno(f: Entreno): Entreno {
  const { id, fecha, inicio, segundos, sigla, nombre, programId, ejercicios } = f
  return { id, fecha, inicio, segundos, sigla, nombre, programId, ejercicios }
}

function ponerPlan(programId: string, rutina: string, nivel: Level, rotacion: Rotacion) {
  if (!programa) return
  tuPlan.value = {
    status: 'ready',
    programId,
    rutina,
    nivel,
    rotacion,
    donde: dondeVas(programa, rotacion),
    semana: sesionesDeSemana(programa, rotacion, porNombre),
  }
}

// Lo que cambia en memoria se guarda solo: la sesión en curso a cada serie y, en el plan, descansos y músculos
let vigilando = false
function vigilar() {
  if (vigilando) return
  vigilando = true
  effect(() => {
    const en = sesionEnCurso.value
    void guardarEnCurso(en).catch((error) => logError(error, 'guardar la sesión en curso'))
  })
  effect(() => {
    const cambios = { descansos: descansosElegidos.value, musculos: elecciones.value }
    void guardarEnPlan(cambios).catch((error) => logError(error, 'guardar el plan'))
  })
}

async function guardarEnCurso(en: SesionEnCurso | null): Promise<void> {
  const db = await getDb()
  if (!en || en.terminada !== null) {
    await db.delete('workouts', EN_CURSO)
    return
  }
  const fila: FilaEntreno = {
    id: EN_CURSO,
    date: localDate(new Date(en.inicio)),
    status: WORKOUT_STATUS.inProgress,
    sesion: en,
  }
  await db.put('workouts', fila)
}

async function guardarEnPlan(cambios: Pick<PlanGuardado, 'descansos' | 'musculos'>): Promise<void> {
  const db = await getDb()
  const plan = (await db.get('plans', 'current')) as PlanGuardado | undefined
  if (plan) await db.put('plans', { ...plan, ...cambios })
}

/** Lo hecho de una sesión, como se guarda: solo las series marcadas, en el orden de hoy. */
export function entrenoDe(en: SesionEnCurso, programId: string, ahora: number): Entreno {
  const ejercicios = ejerciciosDe(en)
  return {
    id: crypto.randomUUID(),
    fecha: localDate(new Date(en.inicio)),
    inicio: en.inicio,
    segundos: Math.round(segundosSesion({ ...en, terminada: ahora }, ahora)),
    sigla: en.sigla,
    nombre: en.nombre,
    programId,
    ejercicios: en.orden.flatMap((i, puesto) => {
      const e = ejercicios[i]
      const x = en.ejercicios[i]
      const series = x.series
        .filter((s) => s.hecha)
        .map((s) => ({ kg: parseDecimal(s.kg), reps: parseDecimal(s.reps) ?? 0 }))
      return series.length
        ? [{ nombre: nombreHoy(e, x), musculo: e.musculo, series, puesto: puesto + 1 }]
        : []
    }),
  }
}

/**
 * Termina la sesión: guarda lo hecho, pasa a la siguiente de la rotación (tras la que has hecho) y deja la sesión
 * terminada en memoria para el resumen.
 */
export async function terminarEntreno(en: SesionEnCurso, ahora: number): Promise<void> {
  const plan = tuPlan.value
  sesionEnCurso.value = { ...en, terminada: ahora }
  if (plan.status !== 'ready' || !programa) return
  const entreno = entrenoDe(en, plan.programId, ahora)
  const hecha = plan.semana.findIndex((s) => s.sigla === en.sigla)
  const rotacion = hecha >= 0 ? avanzar(programa, plan.rotacion, hecha) : plan.rotacion
  try {
    const db = await getDb()
    if (entreno.ejercicios.length) {
      const fila: FilaEntreno = { ...entreno, date: entreno.fecha, status: WORKOUT_STATUS.finished }
      await db.put('workouts', fila)
    }
    const guardada: RotacionGuardada = { id: 'current', programId: plan.programId, ...rotacion }
    await db.put('rotation', guardada)
    if (entreno.ejercicios.length) entrenos.value = [...entrenos.value, entreno]
    ultimoGuardado = { id: entreno.id, rotacion: plan.rotacion }
    ponerPlan(plan.programId, plan.rutina, plan.nivel, rotacion)
  } catch (error) {
    logError(error, 'terminar el entreno')
  }
}

/** «Me faltó un ejercicio»: deshace el guardado del entreno (y el paso de la rotación) y vuelve a abrir la sesión. */
export async function reabrirEntreno(en: SesionEnCurso): Promise<void> {
  const plan = tuPlan.value
  const deshacer = ultimoGuardado
  ultimoGuardado = null
  sesionEnCurso.value = { ...en, terminada: null }
  if (!deshacer || plan.status !== 'ready') return
  try {
    const db = await getDb()
    await db.delete('workouts', deshacer.id)
    const guardada: RotacionGuardada = { id: 'current', programId: plan.programId, ...deshacer.rotacion }
    await db.put('rotation', guardada)
    entrenos.value = entrenos.value.filter((x) => x.id !== deshacer.id)
    ponerPlan(plan.programId, plan.rutina, plan.nivel, deshacer.rotacion)
  } catch (error) {
    logError(error, 'reabrir el entreno')
  }
}
