import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { cambiarPauta } from '../domain/routineEdit.ts'
import { marcaDe, vistosEntrenador, type ConsejoEntrenador } from '../state/entrenador.ts'
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

async function marcar(c: ConsejoEntrenador): Promise<void> {
  // Solo las últimas 200 marcas: de semanas viejas no hace falta acordarse
  const vistos = [...vistosEntrenador.value, marcaDe(c)].slice(-200)
  vistosEntrenador.value = vistos
  try {
    await (await getDb()).put('userContent', { id: ID, target: 'entrenador', vistos } satisfies Fila)
  } catch (error) {
    logError(error, 'guardar el entrenador')
  }
}

/** «Aplicar»: una serie más en ese ejercicio de tu plan (todas las semanas, como Editar rutina). */
export async function aplicarConsejo(c: ConsejoEntrenador): Promise<void> {
  const p = c.propuesta
  if (p) await editarSesion(p.sigla, (ed) => cambiarPauta(ed, p.clave, { series: p.a }))
  await marcar(c)
}

/** «Ahora no» o «Entendido»: no vuelve a salir esta semana. */
export async function dejarConsejo(c: ConsejoEntrenador): Promise<void> {
  await marcar(c)
}
