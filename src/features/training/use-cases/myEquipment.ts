import { getDb } from '../../../shared/data/db.ts'
import { formatDecimal } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { cambiarMaterial, porMaterial } from '../domain/equipment.ts'
import type { Equipment } from '../domain/exerciseLibrary.ts'
import { DISCOS } from '../domain/workoutTools.ts'
import { discosQueFaltan, materialQueFalta } from '../state/material.ts'
import { porNombre } from './exerciseLibrary.ts'

/** En `userContent`: el material que te falta y los discos que no hay. */
const ID = 'material'
type Guardado = { id: typeof ID; target: 'material'; falta: Equipment[]; faltanDiscos?: number[] }

let carga: Promise<void> | null = null

/** Carga tu material (una vez). */
export function cargarMaterial(): Promise<void> {
  carga ??= (async () => {
    try {
      const db = await getDb()
      const g = (await db.get('userContent', ID)) as Guardado | undefined
      if (g) {
        materialQueFalta.value = g.falta ?? []
        discosQueFaltan.value = g.faltanDiscos ?? []
      }
    } catch (error) {
      logError(error, 'cargar tu material')
    }
  })()
  return carga
}

/** Dice si tienes un material y lo guarda. */
export async function tenerMaterial(id: Equipment, tienes: boolean): Promise<void> {
  materialQueFalta.value = cambiarMaterial(materialQueFalta.value, id, tienes)
  await guardar()
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
  const fila: Guardado = {
    id: ID,
    target: 'material',
    falta: materialQueFalta.value,
    faltanDiscos: discosQueFaltan.value,
  }
  try {
    await (await getDb()).put('userContent', fila)
  } catch (error) {
    logError(error, 'guardar tu material')
  }
}

/** El material de un ejercicio por su nombre (los de una sesión o una rutina), si está en la biblioteca. */
export function materialPorNombre(nombre: string): Equipment | null {
  return porNombre(nombre)?.equipment ?? null
}

/** Ordena por tu material: lo que no tienes, aparte para ir al final. */
export function segunTuMaterial<T>(lista: readonly T[], materialDe: (x: T) => Equipment | null | undefined) {
  return porMaterial(lista, materialDe, materialQueFalta.value)
}

/** De unos ejercicios (por su nombre), los que no se hacen con tu material. */
export function fueraDeTuMaterial(nombres: readonly string[]): string[] {
  return segunTuMaterial(nombres, materialPorNombre).noTienes
}
