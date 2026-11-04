import { getDb } from '../../../shared/data/db.ts'
import { plainText } from '../../../shared/lib/format.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { sinClaves } from '../../../shared/lib/object.ts'
import { notasEjercicio } from '../state/notas.ts'
import { porNombre } from './exerciseLibrary.ts'

// En `userContent`, una fila por ejercicio con tu nota. Solo en tu móvil.
type FilaNota = { id: string; target: 'nota-ejercicio'; clave: string; texto: string }

/** La clave de la nota: el ejercicio de la biblioteca (con cualquiera de sus nombres) o, si no está, su nombre sin tildes. */
export const claveNota = (nombre: string) => porNombre(nombre)?.id ?? plainText(nombre.trim())

/** Tu nota de un ejercicio (vacía si no hay). */
export const notaDe = (nombre: string) => notasEjercicio.value[claveNota(nombre)] ?? ''

let cargadas = false

/** Carga tus notas (una vez). */
export async function cargarNotas(): Promise<void> {
  if (cargadas) return
  cargadas = true
  try {
    const db = await getDb()
    const filas = (await db.getAllFromIndex('userContent', 'target', 'nota-ejercicio')) as FilaNota[]
    notasEjercicio.value = Object.fromEntries(filas.map((f) => [f.clave, f.texto]))
  } catch (error) {
    logError(error, 'cargar tus notas')
  }
}

/** Guarda tu nota de un ejercicio para siempre (vacía: la borra). */
export async function guardarNota(nombre: string, texto: string): Promise<void> {
  const clave = claveNota(nombre)
  const limpio = texto.trim()
  notasEjercicio.value = limpio
    ? { ...notasEjercicio.value, [clave]: limpio }
    : sinClaves(notasEjercicio.value, [clave])
  try {
    const db = await getDb()
    const id = `nota:${clave}`
    if (limpio) {
      const fila: FilaNota = { id, target: 'nota-ejercicio', clave, texto: limpio }
      await db.put('userContent', fila)
    } else await db.delete('userContent', id)
  } catch (error) {
    logError(error, 'guardar tu nota')
  }
}
