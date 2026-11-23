// Editar tu plan (Editar rutina, la sesión y las fichas): cambiar un ejercicio por otro, editar una sesión, sus nombres,
// los días de descanso, el orden de tu semana, añadir y quitar sesiones tuyas y volver a la rutina original. Cada acción
// cambia lo editado (planEditado.ts), vuelve a montar tu semana y lo guarda.
import { logError } from '../../../shared/lib/logger.ts'
import { descansosPorSesion, trasDe } from '../domain/restDays.ts'
import type { EdicionSesion } from '../domain/routineEdit.ts'
import { semanaDeFilas, siglaNueva, type FilaSemana, type SesionPropia } from '../domain/weekOrder.ts'
import { elecciones } from '../state/musculos.ts'
import { tuPlan } from '../state/plan.ts'
import { editado, guardarEnPlan } from './planEditado.ts'
import { repartirFotosDeSerie } from './sessionPhotos.ts'
import { guardarRotacion, remontarPlan } from './training.ts'

/**
 * Cambia un ejercicio en tu plan para las próximas veces (`nuevo`), o lo deja como en la rutina (null). `deLaRutina` es
 * el nombre que trae la rutina. La pauta (series, repeticiones, esfuerzo y descanso) sigue siendo la de la rutina.
 */
export async function cambiarEnPlan(deLaRutina: string, nuevo: string | null): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  const resto = Object.fromEntries(Object.entries(editado.cambios).filter(([k]) => k !== deLaRutina))
  editado.cambios = nuevo && nuevo !== deLaRutina ? { ...resto, [deLaRutina]: nuevo } : resto
  remontarPlan()
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
  editado.ediciones = { ...editado.ediciones, [sigla]: cambio(editado.ediciones[sigla] ?? {}) }
  remontarPlan()
  try {
    await guardarEnPlan()
  } catch (error) {
    logError(error, 'editar la rutina')
  }
}

/** Lo que editaste en una sesión (para «Deshacer» en Editar rutina). */
export const edicionDe = (sigla: string): EdicionSesion => editado.ediciones[sigla] ?? {}

/** Cambia los descansos obligatorios (tras qué sesiones van) o vuelve a los de la rutina (null), y lo guarda. */
export async function cambiarDescansos(tras: number[] | null): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  editado.descansosTras = tras
  remontarPlan()
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
  editado.nombres = { ...editado.nombres, [sigla]: nombre.trim() }
  remontarPlan()
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
    editado.ediciones = Object.fromEntries(Object.entries(editado.ediciones).filter(([k]) => k !== sigla))
    editado.nombres = Object.fromEntries(Object.entries(editado.nombres).filter(([k]) => k !== sigla))
  } else {
    editado.nombres = {}
    editado.ediciones = {}
    editado.cambios = {}
    editado.descansosTras = null
    editado.ordenSemana = null
    editado.propias = []
    elecciones.value = {}
  }
  remontarPlan()
  try {
    await guardarEnPlan()
  } catch (error) {
    logError(error, 'volver a la rutina')
  }
}

/**
 * Pone tu semana como la dejas en Editar rutina (sesiones y descansos, en ese orden) y la guarda. La sesión que tocaba
 * sigue tocando, esté donde esté ahora.
 */
async function ponerSemana(
  orden: string[],
  porSesion: number[],
  nuevas: SesionPropia[] = editado.propias,
): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  const toca = plan.semana[plan.rotacion.siguiente]?.sigla
  editado.ordenSemana = orden
  editado.descansosTras = trasDe(porSesion)
  editado.propias = nuevas
  // Si la que tocaba ya no está (la quitaste), toca la que queda en su puesto
  const donde = toca ? orden.indexOf(toca) : -1
  const siguiente = donde >= 0 ? donde : Math.max(0, Math.min(plan.rotacion.siguiente, orden.length - 1))
  const rotacion = { ...plan.rotacion, siguiente }
  remontarPlan(rotacion)
  // Una sesión nueva coge su foto de serie
  void repartirFotosDeSerie(plan.programId)
  try {
    await Promise.all([guardarEnPlan(), guardarRotacion(plan.programId, rotacion)])
  } catch (error) {
    logError(error, 'cambiar tu semana')
  }
}

/** Tu semana movida con el dedo en Editar rutina: el orden de las sesiones y dónde va cada día de descanso. */
export async function cambiarSemana(filas: readonly FilaSemana[]): Promise<void> {
  const { orden, porSesion } = semanaDeFilas(filas)
  await ponerSemana(orden, porSesion)
}

/** Añade una sesión tuya al final de la semana, vacía (se le añaden ejercicios en Editar rutina). Devuelve su sigla. */
export async function anadirSesion(): Promise<string | null> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return null
  const siglas = plan.semana.map((s) => s.sigla)
  const nueva = { sigla: siglaNueva(siglas), nombre: `Sesión ${siglas.length + 1}` }
  const porSesion = descansosPorSesion(plan.descansos, siglas.length)
  await ponerSemana([...siglas, nueva.sigla], [...porSesion, 0], [...editado.propias, nueva])
  return nueva.sigla
}

/** ¿Es una sesión que añadiste tú? (solo esas se quitan; las de la rutina se mueven). */
export const esPropia = (sigla: string) => editado.propias.some((p) => p.sigla === sigla)

/** Quita una sesión que añadiste (con sus ejercicios y su nombre); sus descansos pasan a la de antes. */
export async function quitarSesion(sigla: string): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready' || !esPropia(sigla)) return
  const siglas = plan.semana.map((s) => s.sigla)
  const i = siglas.indexOf(sigla)
  const porSesion = descansosPorSesion(plan.descansos, siglas.length)
  if (i > 0) porSesion[i - 1] += porSesion[i]
  editado.ediciones = Object.fromEntries(Object.entries(editado.ediciones).filter(([k]) => k !== sigla))
  editado.nombres = Object.fromEntries(Object.entries(editado.nombres).filter(([k]) => k !== sigla))
  await ponerSemana(
    siglas.filter((x) => x !== sigla),
    porSesion.filter((_, j) => j !== i),
    editado.propias.filter((p) => p.sigla !== sigla),
  )
}
