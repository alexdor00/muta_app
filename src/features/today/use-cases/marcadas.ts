// Guardar lo que marcas a mano en Hoy (`userContent`, id «hoy-marcadas»): solo los últimos días.
import { getDb } from '../../../shared/data/db.ts'
import { addDays } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { marcadas } from '../state/marcadas.ts'

export const ID_MARCADAS = 'hoy-marcadas'
/** Cuántos días se guardan (lo de antes ya no se ve en Hoy). */
const DIAS = 7

type Guardado = { id: typeof ID_MARCADAS; target: 'hoy'; dias: Record<string, string[]> }

let carga: Promise<void> | null = null

/** Lee lo marcado (una vez por visita). */
export function cargarMarcadas(): Promise<void> {
  carga ??= (async () => {
    try {
      const g = (await (await getDb()).get('userContent', ID_MARCADAS)) as Guardado | undefined
      marcadas.value = g?.dias ?? {}
    } catch (error) {
      logError(error, 'leer lo marcado en Hoy')
    }
  })()
  return carga
}

/** Marca o desmarca una cosa de un día. */
export async function marcar(fecha: string, id: string): Promise<void> {
  const deHoy = marcadas.value[fecha] ?? []
  const desde = addDays(fecha, -(DIAS - 1))
  const dias = Object.fromEntries(Object.entries(marcadas.value).filter(([d]) => d >= desde))
  dias[fecha] = deHoy.includes(id) ? deHoy.filter((x) => x !== id) : [...deHoy, id]
  marcadas.value = dias
  const fila: Guardado = { id: ID_MARCADAS, target: 'hoy', dias }
  await (await getDb()).put('userContent', fila)
}
