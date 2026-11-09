import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { cambiarPauta } from '../domain/routineEdit.ts'
import { marcaAplicado, marcaDe, vistosEntrenador, type ConsejoEntrenador } from '../state/entrenador.ts'
import { elegirModo } from '../state/musculos.ts'
import { editarSesion } from './training.ts'

const ID = 'entrenador-vistos'
type Fila = { id: typeof ID; target: 'entrenador'; vistos: string[] }

/** Lo que ya aplicaste o dejaste («Ahora no»), para no volver a proponerlo esa semana. */
export async function cargarEntrenador(): Promise<void> {
  try {
    const fila = (await (await getDb()).get('userContent', ID)) as Fila | undefined
    vistosEntrenador.value = fila?.vistos ?? []
  } catch (error) {
    logError(error, 'leer el entrenador')
  }
}

async function marcar(...marcas: string[]): Promise<void> {
  // Solo las últimas 200 marcas: de semanas viejas no hace falta acordarse
  const vistos = [...vistosEntrenador.value, ...marcas].slice(-200)
  vistosEntrenador.value = vistos
  try {
    await (await getDb()).put('userContent', { id: ID, target: 'entrenador', vistos } satisfies Fila)
  } catch (error) {
    logError(error, 'guardar el entrenador')
  }
}

/**
 * «Aplicar»: las series nuevas en ese ejercicio de tu plan (todas las semanas, como Editar rutina). La semana que viene
 * no propone otro cambio en ese músculo: primero se ve el efecto.
 */
export async function aplicarConsejo(c: ConsejoEntrenador): Promise<void> {
  const p = c.propuesta
  if (p) await editarSesion(p.sigla, (ed) => cambiarPauta(ed, p.clave, { series: p.a }))
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
