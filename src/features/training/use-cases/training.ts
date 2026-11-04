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
import { aplicarEdicion, type EdicionSesion, type Ediciones } from '../domain/routineEdit.ts'
import {
  avanzar,
  dondeVas,
  INICIO,
  pautaEnPrograma,
  sesionesDeSemana,
  type Rotacion,
} from '../domain/workoutPlan.ts'
import { descansosDeRutina } from '../domain/restDays.ts'
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
import { cargarNotas } from './exerciseNotes.ts'
import { cargarMisConsejos } from './myTips.ts'
import { cargarFotos } from './sessionPhotos.ts'
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
  /** Ejercicios que cambiaste en tu plan: nombre en la rutina → el que lo sustituye. */
  cambios?: Record<string, string>
  /** Lo que cambias en cada sesión desde Editar rutina (orden, quitar, añadir y pauta), por sigla. */
  ediciones?: Ediciones
  /** El nombre que le pusiste a cada sesión en Editar rutina, por sigla. */
  nombres?: Record<string, string>
  /** Descansos obligatorios cambiados en Editar rutina: tras qué sesiones van (sin esto, los de la rutina). */
  descansosTras?: number[]
}

type RotacionGuardada = Rotacion & { id: 'current'; programId: string }

/** En `workouts`: un entreno terminado o, con este id, la sesión en curso. */
const EN_CURSO = 'en-curso'
type FilaEntreno =
  | (Entreno & { date: string; status: typeof WORKOUT_STATUS.finished })
  | { id: typeof EN_CURSO; date: string; status: typeof WORKOUT_STATUS.inProgress; sesion: SesionEnCurso }

/** El programa con tus elecciones (para avanzar la rotación al terminar). */
let programa: ProgramData | null = null
/** Lo que cambiaste en tu plan (se aplica al montar las sesiones). */
let cambios: Record<string, string> = {}
/** Lo que editaste en cada sesión (se aplica al montar la semana). */
let ediciones: Ediciones = {}
/** Los nombres que pusiste a tus sesiones. */
let nombresPropios: Record<string, string> = {}
/** Los descansos obligatorios que cambiaste (null: los de la rutina). */
let descansosTras: number[] | null = null
let carga: Promise<void> | null = null
/** El último entreno guardado y la rotación de antes, para «Me faltó un ejercicio». */
let ultimoGuardado: { id: string; rotacion: Rotacion } | null = null

/** Carga tu plan, tus entrenos, la sesión en curso, tus fotos y tus consejos (una vez; `forzar` tras cambiar de rutina). */
export function cargarPlan(forzar = false): Promise<void> {
  void cargarMisConsejos()
  void cargarNotas()
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
    cambios = plan.cambios ?? {}
    ediciones = plan.ediciones ?? {}
    nombresPropios = plan.nombres ?? {}
    descansosTras = plan.descansosTras ?? null
    ponerPlan(plan.programId, entry.title, nivel, rotacion)
    void cargarFotos(plan.programId)
    const enCurso = filas.find((f) => f.id === EN_CURSO)
    if (enCurso && 'sesion' in enCurso && !sesionEnCurso.value) sesionEnCurso.value = enCurso.sesion
    vigilar()
  } catch (error) {
    logError(error, 'cargar el plan')
    tuPlan.value = { status: 'none' }
  }
}

/**
 * Cómo pauta tu rutina un ejercicio de la biblioteca (por su id, con sus otros nombres) en cualquiera de sus semanas, para su
 * ficha cuando no está en la semana que toca. null si tu rutina no lo lleva.
 */
export function pautaEnTuRutina(id: string) {
  return programa ? pautaEnPrograma(programa, (n) => porNombre(n)?.id === id) : null
}

/** Una fila guardada sin los campos de la base. */
function aEntreno(f: Entreno): Entreno {
  const { id, fecha, inicio, segundos, sigla, nombre, programId, ejercicios } = f
  return { id, fecha, inicio, segundos, sigla, nombre, programId, ejercicios }
}

function ponerPlan(programId: string, rutina: string, nivel: Level, rotacion: Rotacion) {
  if (!programa) return
  const semana = sesionesDeSemana(programa, rotacion, porNombre, cambios)
    .map((s) => aplicarEdicion(s, ediciones[s.sigla], porNombre))
    .map((s) => (nombresPropios[s.sigla] ? { ...s, nombre: nombresPropios[s.sigla] } : s))
  const dias = programa.blocks[rotacion.bloque]?.weeks[rotacion.semana]?.days ?? []
  const musculos = semana.map((s) => s.ejercicios.flatMap((e) => (e.musculo ? [e.musculo] : [])))
  tuPlan.value = {
    status: 'ready',
    programId,
    rutina,
    nivel,
    rotacion,
    donde: dondeVas(programa, rotacion),
    semana,
    descansos: descansosTras ?? descansosDeRutina(dias, musculos, programa.restRules, rotacion.bloque),
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
    // Leerlos aquí hace que el efecto se repita cuando cambian
    void [descansosElegidos.value, elecciones.value]
    void guardarEnPlan().catch((error) => logError(error, 'guardar el plan'))
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

// Las escrituras del plan van en cola y cada una guarda lo último de todo (descansos, músculos, cambios y ediciones):
// dos cambios casi a la vez no se pisan.
let cola: Promise<void> = Promise.resolve()

function guardarEnPlan(): Promise<void> {
  const escribir = async () => {
    const db = await getDb()
    const plan = (await db.get('plans', 'current')) as PlanGuardado | undefined
    if (!plan) return
    await db.put('plans', {
      ...plan,
      descansos: descansosElegidos.value,
      musculos: elecciones.value,
      cambios,
      ediciones,
      nombres: nombresPropios,
      descansosTras: descansosTras ?? undefined,
    })
  }
  cola = cola.then(escribir, escribir)
  return cola
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

/**
 * Cambia un ejercicio en tu plan para las próximas veces (`nuevo`), o lo deja como en la rutina (null). `deLaRutina` es
 * el nombre que trae la rutina. La pauta (series, repeticiones, esfuerzo y descanso) sigue siendo la de la rutina.
 */
export async function cambiarEnPlan(deLaRutina: string, nuevo: string | null): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  const resto = Object.fromEntries(Object.entries(cambios).filter(([k]) => k !== deLaRutina))
  cambios = nuevo && nuevo !== deLaRutina ? { ...resto, [deLaRutina]: nuevo } : resto
  ponerPlan(plan.programId, plan.rutina, plan.nivel, plan.rotacion)
  try {
    await guardarEnPlan()
  } catch (error) {
    logError(error, 'cambiar un ejercicio en el plan')
  }
}

/**
 * Lo que se cambia desde la sesión: hoy ya está cambiado; con `enPlan`, también en tu plan (o se vuelve al de la rutina si
 * eliges ese). Devuelve el aviso que se enseña.
 */
export function cambiarDesdeSesion(
  e: { nombre: string; enLugarDe?: string },
  nuevo: string,
  enPlan: boolean,
): string {
  if (!enPlan) return `Cambiado por ${nuevo}, solo para hoy`
  const deLaRutina = e.enLugarDe ?? e.nombre
  void cambiarEnPlan(deLaRutina, nuevo === deLaRutina ? null : nuevo)
  return nuevo === deLaRutina ? `Vuelves a ${nuevo} en tu plan` : `Cambiado por ${nuevo} en tu plan`
}

/** Cambia una sesión de tu plan desde Editar rutina (para todas las semanas) y la guarda. */
export async function editarSesion(
  sigla: string,
  cambio: (ed: EdicionSesion) => EdicionSesion,
): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  ediciones = { ...ediciones, [sigla]: cambio(ediciones[sigla] ?? {}) }
  ponerPlan(plan.programId, plan.rutina, plan.nivel, plan.rotacion)
  try {
    await guardarEnPlan()
  } catch (error) {
    logError(error, 'editar la rutina')
  }
}

/** Cambia los descansos obligatorios (tras qué sesiones van) o vuelve a los de la rutina (null), y lo guarda. */
export async function cambiarDescansos(tras: number[] | null): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  descansosTras = tras
  ponerPlan(plan.programId, plan.rutina, plan.nivel, plan.rotacion)
  try {
    await guardarEnPlan()
  } catch (error) {
    logError(error, 'cambiar los descansos')
  }
}

/** Cambia el nombre de una sesión de tu plan (sale en todas partes) y lo guarda. */
export async function renombrarSesion(sigla: string, nombre: string): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready' || !nombre.trim()) return
  nombresPropios = { ...nombresPropios, [sigla]: nombre.trim() }
  ponerPlan(plan.programId, plan.rutina, plan.nivel, plan.rotacion)
  try {
    await guardarEnPlan()
  } catch (error) {
    logError(error, 'cambiar el nombre de la sesión')
  }
}

/**
 * Vuelve a la rutina original: una sesión (quita lo que editaste en ella y su nombre) o todas (`null`: también los ejercicios
 * cambiados por otros, los descansos y lo elegido en la ficha de cada músculo).
 */
export async function volverARutina(sigla: string | null): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  if (sigla) {
    ediciones = Object.fromEntries(Object.entries(ediciones).filter(([k]) => k !== sigla))
    nombresPropios = Object.fromEntries(Object.entries(nombresPropios).filter(([k]) => k !== sigla))
  } else {
    nombresPropios = {}
    ediciones = {}
    cambios = {}
    descansosTras = null
    elecciones.value = {}
  }
  ponerPlan(plan.programId, plan.rutina, plan.nivel, plan.rotacion)
  try {
    await guardarEnPlan()
  } catch (error) {
    logError(error, 'volver a la rutina')
  }
}
