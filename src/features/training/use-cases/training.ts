import { effect } from '@preact/signals'
import { getDb } from '../../../shared/data/db.ts'
import { WORKOUT_STATUS } from '../../../shared/data/schema.ts'
import { localDate } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { CATALOG, sourceOf, type Level } from '../domain/catalog.ts'
import { applyChoices } from '../domain/planProgram.ts'
import type { ProgramData } from '../domain/program.ts'
import { selectVariant } from '../domain/programInfo.ts'
import type { Entreno } from '../domain/workoutHistory.ts'
import { aplicarEdicion } from '../domain/routineEdit.ts'
import {
  avanzar,
  dondeVas,
  INICIO,
  pautaEnPrograma,
  sesionesDeSemana,
  type Rotacion,
} from '../domain/workoutPlan.ts'
import { PREFIJO_MIA, type RutinaMia } from '../domain/csvRoutine.ts'
import { descansosDeRutina } from '../domain/restDays.ts'
import { ordenarSemana, sesionVacia } from '../domain/weekOrder.ts'
import { elecciones } from '../state/musculos.ts'
import { claveEjercicio, entrenos, tuPlan } from '../state/plan.ts'
import { descansosElegidos, sesionEnCurso, type SesionEnCurso } from '../state/sesionEnCurso.ts'
import { finDeLaSesion } from '../state/tiempoSesion.ts'
import { porNombre } from './exerciseLibrary.ts'
import { cargarFinDeRutina, marcarFinDeRutina, quitarFinDeRutina } from './finDeRutina.ts'
import { semanasDelPrograma, terminaLaRutina } from '../domain/finDeRutina.ts'
import { finDeRutina } from '../state/finDeRutina.ts'
import { cargarEditado, editado, guardarEnPlan, type PlanGuardado } from './planEditado.ts'
import { cargarNotas } from './exerciseNotes.ts'
import { entrenoDe } from './workoutRecord.ts'
import { cargarMaterial } from './myEquipment.ts'
import { cargarMisConsejos } from './myTips.ts'
import { cargarFotos, repartirFotosDeSerie } from './sessionPhotos.ts'
import { cargarFase } from './fase.ts'
import { LEVELS } from './loadRoutines.ts'
import { BUILT_IN } from './routineDetail.ts'

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

/** Carga tu plan, tus entrenos, la sesión en curso, tus fotos, tus consejos y tu material (una vez; `forzar` tras cambiar de rutina). */
/** Un ejercicio se reconoce por su ejercicio de la biblioteca o, sin él, por su nombre (cada nombre se busca una vez). */
const claves = new Map<string, string>()
function claveDe(nombre: string): string {
  let k = claves.get(nombre)
  if (k === undefined) {
    k = porNombre(nombre)?.id ?? nombre
    claves.set(nombre, k)
  }
  return k
}

export function cargarPlan(forzar = false): Promise<void> {
  claveEjercicio.value = claveDe
  void cargarMisConsejos()
  void cargarMaterial()
  void cargarNotas()
  void cargarFase()
  // La marca de «Terminaste tu rutina», solo al leer el plan: si se leyera a cada llamada, una lectura en curso
  // podía devolverla justo después de «Ahora no»
  if (!carga || forzar) {
    carga = leer()
    void cargarFinDeRutina()
  }
  return carga
}

async function leer(): Promise<void> {
  try {
    const db = await getDb()
    const plan = (await db.get('plans', 'current')) as PlanGuardado | undefined
    const entry = plan && CATALOG.find((e) => e.id === plan.programId)
    // Una rutina tuya (cargada desde un CSV) no está en el catálogo: vive en `programs` con su nombre
    const mia =
      plan && !entry && plan.programId.startsWith(PREFIJO_MIA)
        ? ((await db.get('programs', plan.programId)) as RutinaMia | undefined)
        : undefined
    const raw = entry
      ? ((BUILT_IN[sourceOf(entry)] ?? (await db.get('programs', sourceOf(entry)))) as
          ProgramData | undefined)
      : mia
    const titulo = entry?.title ?? mia?.title
    if (!plan || !raw || !titulo) {
      programa = null
      tuPlan.value = { status: 'none' }
      return
    }
    const perfil = (await db.get('profile', 'me')) as { level?: string } | undefined
    const nivel = LEVELS.find((l) => l === perfil?.level) ?? ('intermediate' satisfies Level)
    programa = applyChoices(
      selectVariant(raw, entry?.variant),
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
    cargarEditado(plan)
    ponerPlan(plan.programId, titulo, nivel, rotacion)
    void cargarFotos(plan.programId)
    void repartirFotosDeSerie(plan.programId)
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
  // Las de la rutina y las tuyas, con tus ediciones y tus nombres, en tu orden
  const semana = ordenarSemana(
    [...sesionesDeSemana(programa, rotacion, porNombre, editado.cambios), ...editado.propias.map(sesionVacia)]
      .map((s) => aplicarEdicion(s, editado.ediciones[s.sigla], porNombre))
      .map((s) => (editado.nombres[s.sigla] ? { ...s, nombre: editado.nombres[s.sigla] } : s)),
    editado.ordenSemana,
  )
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
    descansos:
      editado.descansosTras ?? descansosDeRutina(dias, musculos, programa.restRules, rotacion.bloque),
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

/**
 * Termina la sesión: guarda lo hecho, pasa a la siguiente de la rotación (tras la que has hecho) y deja la sesión
 * terminada en memoria para el resumen.
 */
export async function terminarEntreno(en: SesionEnCurso, ahora: number): Promise<void> {
  const plan = tuPlan.value
  // Si la dejaste sin apuntar nada más de 30 min, acabó con tu última serie (usuario, 2026-11-23)
  const fin = finDeLaSesion(en, ahora)
  sesionEnCurso.value = { ...en, terminada: fin }
  if (plan.status !== 'ready' || !programa) return
  const entreno = entrenoDe(en, plan.programId, fin)
  const hecha = plan.semana.findIndex((s) => s.sigla === en.sigla)
  const rotacion = hecha >= 0 ? avanzar(programa, plan.rotacion, hecha, plan.semana.length) : plan.rotacion
  // Era la última sesión de la última semana de una rutina con final (usuario, 2026-11-23)
  const termina = terminaLaRutina(programa, plan.rotacion, hecha, plan.semana.length)
  const semanas = semanasDelPrograma(programa)
  try {
    const db = await getDb()
    if (entreno.ejercicios.length) {
      const fila: FilaEntreno = { ...entreno, date: entreno.fecha, status: WORKOUT_STATUS.finished }
      await db.put('workouts', fila)
    }
    await guardarRotacion(plan.programId, rotacion)
    if (entreno.ejercicios.length) entrenos.value = [...entrenos.value, entreno]
    ultimoGuardado = { id: entreno.id, rotacion: plan.rotacion }
    ponerPlan(plan.programId, plan.rutina, plan.nivel, rotacion)
    if (termina)
      await marcarFinDeRutina({
        programId: plan.programId,
        rutina: plan.rutina,
        fecha: entreno.fecha,
        semanas,
        entrenoId: entreno.id,
      })
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
    await guardarRotacion(plan.programId, deshacer.rotacion)
    entrenos.value = entrenos.value.filter((x) => x.id !== deshacer.id)
    ponerPlan(plan.programId, plan.rutina, plan.nivel, deshacer.rotacion)
    if (finDeRutina.value?.entrenoId === deshacer.id) await quitarFinDeRutina()
  } catch (error) {
    logError(error, 'reabrir el entreno')
  }
}

/** Guarda dónde vas en la rotación. */
export async function guardarRotacion(programId: string, rotacion: Rotacion): Promise<void> {
  const db = await getDb()
  const guardada: RotacionGuardada = { id: 'current', programId, ...rotacion }
  await db.put('rotation', guardada)
}

/** Vuelve a montar tu semana con lo editado (y otra rotación, si se da), tras cambiar algo en Editar rutina. */
export function remontarPlan(rotacion?: Rotacion): void {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  ponerPlan(plan.programId, plan.rutina, plan.nivel, rotacion ?? plan.rotacion)
}
