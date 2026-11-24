import { getDb } from '../../../shared/data/db.ts'
import { formatDecimal } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { cambiarMaterial } from '../domain/equipment.ts'
import { DISCOS } from '../domain/workoutTools.ts'
import { discosQueFaltan } from '../state/material.ts'

/** En `userContent`: los discos que no hay en tu gimnasio (`falta`, de cuando había «Tu material», ya no se usa). */
const ID = 'material'
type Guardado = { id: typeof ID; target: 'material'; falta?: unknown[]; faltanDiscos?: number[] }

let carga: Promise<void> | null = null

/** Carga los discos de tu gimnasio (una vez). */
export function cargarMaterial(): Promise<void> {
  carga ??= (async () => {
    try {
      const db = await getDb()
      const g = (await db.get('userContent', ID)) as Guardado | undefined
      if (g) discosQueFaltan.value = g.faltanDiscos ?? []
    } catch (error) {
      logError(error, 'cargar los discos de tu gimnasio')
    }
  })()
  return carga
}

/** Dice si en tu gimnasio hay discos de `kg` y lo guarda. */
export async function tenerDisco(kg: number, hay: boolean): Promise<void> {
  discosQueFaltan.value = cambiarMaterial(discosQueFaltan.value, kg, hay)
  await guardar()
}

/** Los discos de un gimnasio normal, cada uno con si lo hay en el tuyo. */
export function discosDelGimnasio(): { kg: number; label: string; hay: boolean }[] {
  return DISCOS.map((kg) => ({ kg, label: formatDecimal(kg), hay: !discosQueFaltan.value.includes(kg) }))
}

async function guardar(): Promise<void> {
  const fila: Guardado = { id: ID, target: 'material', faltanDiscos: discosQueFaltan.value }
  try {
    await (await getDb()).put('userContent', fila)
  } catch (error) {
    logError(error, 'guardar los discos de tu gimnasio')
  }
}
