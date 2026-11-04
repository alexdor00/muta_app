import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { cambiarMaterial, porMaterial } from '../domain/equipment.ts'
import type { Equipment } from '../domain/exerciseLibrary.ts'
import { materialQueFalta } from '../state/material.ts'
import { porNombre } from './exerciseLibrary.ts'

/** En `userContent`: el material que te falta. */
const ID = 'material'
type Guardado = { id: typeof ID; target: 'material'; falta: Equipment[] }

let carga: Promise<void> | null = null

/** Carga tu material (una vez). */
export function cargarMaterial(): Promise<void> {
  carga ??= (async () => {
    try {
      const db = await getDb()
      const g = (await db.get('userContent', ID)) as Guardado | undefined
      if (g) materialQueFalta.value = g.falta ?? []
    } catch (error) {
      logError(error, 'cargar tu material')
    }
  })()
  return carga
}

/** Dice si tienes un material y lo guarda. */
export async function tenerMaterial(id: Equipment, tienes: boolean): Promise<void> {
  materialQueFalta.value = cambiarMaterial(materialQueFalta.value, id, tienes)
  const fila: Guardado = { id: ID, target: 'material', falta: materialQueFalta.value }
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
