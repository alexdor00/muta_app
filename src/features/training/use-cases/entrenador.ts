import { getDb } from '../../../shared/data/db.ts'
import { localDate } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { nutricionParaEntreno } from '../../nutrition/index.ts'
import { propuestaDeQuitar, type Propuesta } from '../domain/coach/revision.ts'
import { cambiarPauta } from '../domain/routineEdit.ts'
import {
  deNutricion,
  marcaAplicado,
  marcaDe,
  marcaParon,
  ultimaSubida,
  vistosEntrenador,
  type ConsejoEntrenador,
} from '../state/entrenador.ts'
import { elegirModo } from '../state/musculos.ts'
import { tuPlan } from '../state/plan.ts'
import { editarSesion } from './editPlan.ts'

const ID = 'entrenador-vistos'
type Fila = { id: typeof ID; target: 'entrenador'; vistos: string[]; subida?: string | null }

/** Lo que ya aplicaste o dejaste («Ahora no»), para no volver a proponerlo esa semana. */
export async function cargarEntrenador(): Promise<void> {
  try {
    const fila = (await (await getDb()).get('userContent', ID)) as Fila | undefined
    vistosEntrenador.value = fila?.vistos ?? []
    ultimaSubida.value = fila?.subida ?? null
  } catch (error) {
    logError(error, 'leer el entrenador')
  }
  // Lo que da Nutrición (tu fase, la recarga, tu comida y cómo estás): para que los dos digan lo mismo
  try {
    deNutricion.value = await nutricionParaEntreno(localDate())
  } catch (error) {
    logError(error, 'leer lo de Nutrición para el entrenador')
  }
}

async function guardar(vistos: string[]): Promise<void> {
  // Solo las últimas 200 marcas: de semanas viejas no hace falta acordarse
  vistosEntrenador.value = vistos.slice(-200)
  try {
    await (
      await getDb()
    ).put('userContent', {
      id: ID,
      target: 'entrenador',
      vistos: vistosEntrenador.value,
      subida: ultimaSubida.value,
    } satisfies Fila)
  } catch (error) {
    logError(error, 'guardar el entrenador')
  }
}

const marcar = (...marcas: string[]) => guardar([...vistosEntrenador.value, ...marcas])

/**
 * «Aplicar»: las series (+1 o +2) o el RIR que elegiste, en ese ejercicio de tu plan (todas las semanas, como Editar
 * rutina). La semana que viene no propone otro cambio en ese músculo: primero se ve el efecto.
 */
export async function aplicarConsejo(c: ConsejoEntrenador, a = c.propuesta?.a): Promise<void> {
  const p = c.propuesta
  if (p && a !== undefined) await editarSesion(p.sigla, (ed) => cambiarPauta(ed, p.clave, { [p.campo]: a }))
  // Una serie más: Nutrición espera a ver su efecto antes de subir kcal en volumen
  if (p?.campo === 'series' && a !== undefined && a > p.de) ultimaSubida.value = localDate()
  await marcar(marcaDe(c), marcaAplicado(c.musculo))
}

/** «No me interesa»: ese músculo pasa a Mantener (como en su ficha) y no se le propone subir. */
export async function noMeInteresa(c: ConsejoEntrenador): Promise<void> {
  elegirModo(c.musculo, 'maintain')
  await marcar(marcaDe(c))
}

/** «Ahora no» o «Entendido»: no vuelve a salir esta semana. */
export async function dejarConsejo(c: ConsejoEntrenador): Promise<void> {
  await marcar(marcaDe(c))
}

/**
 * Vuelves de un parón (guía § 10): una serie menos en cada músculo de tu plan (el ejercicio con más series, nunca por
 * debajo de 2). Devuelve lo cambiado, para «Deshacer».
 */
export async function aplicarParon(vuelta: string): Promise<Propuesta[]> {
  const plan = tuPlan.value
  const hechos: Propuesta[] = []
  if (plan.status === 'ready') {
    const musculos = new Set(
      plan.semana.flatMap((s) => s.ejercicios.flatMap((e) => (e.musculo ? [e.musculo] : []))),
    )
    for (const m of musculos) {
      const p = propuestaDeQuitar(tuPlan.value.status === 'ready' ? tuPlan.value.semana : [], m)
      if (!p) continue
      await editarSesion(p.sigla, (ed) => cambiarPauta(ed, p.clave, { series: p.a }))
      hechos.push(p)
    }
  }
  await marcar(marcaParon(vuelta))
  return hechos
}

/** «Deshacer» del parón: vuelven las series de antes (y la propuesta, por si la quieres luego). */
export async function deshacerParon(vuelta: string, hechos: readonly Propuesta[]): Promise<void> {
  for (const p of hechos) await editarSesion(p.sigla, (ed) => cambiarPauta(ed, p.clave, { series: p.de }))
  await guardar(vistosEntrenador.value.filter((x) => x !== marcaParon(vuelta)))
}

/** «Ahora no» al parón: no vuelve a salir por esta vuelta. */
export async function dejarParon(vuelta: string): Promise<void> {
  await marcar(marcaParon(vuelta))
}

/** El último día que aplicaste una serie más (para Nutrición, sin cargar el entrenador entero). */
export async function leerUltimaSubida(): Promise<string | null> {
  try {
    const fila = (await (await getDb()).get('userContent', ID)) as Fila | undefined
    return fila?.subida ?? null
  } catch {
    return null
  }
}
