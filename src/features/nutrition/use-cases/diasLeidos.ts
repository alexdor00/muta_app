// Tus días de comida en memoria (usuario, 2026-11-23; docs/problemas-con-el-tiempo.md, problemas 1 y 5): al abrir Nutrición se
// leen los últimos 35 días; la racha de días redondos lee más si hace falta; y un día que no se leyó se sabe (guardarlo
// conserva lo que tenía). Los de antes siguen guardados en `foodLog`.
import { getDb } from '../../../shared/data/db.ts'
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { dias, hoy, rachaRedonda } from '../state/comida.ts'
import type { DiaGuardado } from './nutritionStore.ts'

/** Desde qué día están leídos tus días (null: aún nada). */
let leidoDesde: string | null = null

export function empezarLectura(desde: string): void {
  leidoDesde = desde
}

export function olvidarLectura(): void {
  leidoDesde = null
}

/** Si un día está en memoria: lo apuntado o, sin nada, dentro de lo leído. */
export const estaLeido = (date: string) => date in dias.value || (leidoDesde !== null && date >= leidoDesde)

/** Lee tus días guardados desde `desde` hasta el primero ya leído. Devuelve cuántos había. */
async function leerDiasDesde(desde: string): Promise<number> {
  if (leidoDesde === null || desde >= leidoDesde) return 0
  const db = await getDb()
  const log = (await db.getAll('foodLog', IDBKeyRange.bound(desde, leidoDesde, false, true))) as DiaGuardado[]
  dias.value = { ...Object.fromEntries(log.map((d) => [d.date, d.apuntes])), ...dias.value }
  leidoDesde = desde
  return log.length
}

/**
 * La racha de días redondos sin tope: si llega al primer día leído, se leen 60 días más, hasta que se corte o no haya más
 * días guardados.
 */
export async function leerLaRacha(): Promise<void> {
  try {
    while (leidoDesde !== null && rachaRedonda.value >= daysBetween(leidoDesde, hoy.value)) {
      if (!(await leerDiasDesde(addDays(leidoDesde, -60)))) break
    }
  } catch (error) {
    logError(error, 'leer tu racha')
  }
}
