// Guardar, leer y quitar la marca de «Terminaste tu rutina» (en `userContent`). Repetirla (una etapa nueva con la misma
// rutina) está en mesocycles.ts.
import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { cambioDePeso } from '../../nutrition/index.ts'
import { finDeRutina, type FinDeRutina } from '../state/finDeRutina.ts'

const ID = 'fin-de-rutina'
type Fila = FinDeRutina & { id: typeof ID; target: typeof ID }

/** Cada cambio suma uno: una lectura que empezó antes de un cambio no lo pisa. */
let version = 0

export async function cargarFinDeRutina(): Promise<void> {
  const v = version
  try {
    const fila = (await (await getDb()).get('userContent', ID)) as Fila | undefined
    if (v !== version) return
    finDeRutina.value = fila
      ? {
          programId: fila.programId,
          rutina: fila.rutina,
          fecha: fila.fecha,
          semanas: fila.semanas,
          entrenoId: fila.entrenoId,
        }
      : null
  } catch (error) {
    logError(error, 'leer el final de tu rutina')
  }
}

export async function marcarFinDeRutina(fin: FinDeRutina): Promise<void> {
  version++
  finDeRutina.value = fin
  await (await getDb()).put('userContent', { ...fin, id: ID, target: ID })
}

/** «Ahora no», cambiar de rutina o deshacer el entreno con que acabó: la marca se quita. */
export async function quitarFinDeRutina(): Promise<void> {
  version++
  finDeRutina.value = null
  try {
    await (await getDb()).delete('userContent', ID)
  } catch (error) {
    logError(error, 'quitar el final de tu rutina')
  }
}

/**
 * Las cifras de la etapa con que terminas la rutina (para el resumen): sesiones, tu fuerza, tus récords y cuánto cambió
 * tu peso (lo da Nutrición; null sin pesajes).
 */
export async function cifrasDeLaRutina(
  hoy: string,
): Promise<{ sesiones: number; fuerza: number | null; records: number; peso: number | null } | null> {
  try {
    const { mesociclosAlDia } = await import('./mesocycles.ts')
    const { mesocicloParaProgreso } = await import('./forProgreso.ts')
    const { actual } = await mesociclosAlDia(hoy)
    if (!actual) return null
    const [d, peso] = await Promise.all([
      mesocicloParaProgreso(actual.id, hoy, () => null),
      cambioDePeso(actual.inicio, hoy).catch(() => null),
    ])
    return d ? { sesiones: d.meso.sesiones, fuerza: d.meso.fuerza, records: d.meso.records, peso } : null
  } catch (error) {
    logError(error, 'leer las cifras de tu rutina')
    return null
  }
}
