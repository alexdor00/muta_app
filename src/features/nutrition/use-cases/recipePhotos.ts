// Tu foto de un plato (usuario, 2026-11-17: cambiar la foto de tus comidas y centrarla, como la de una sesión de Entreno).
// En `userContent`, una fila por plato con la imagen ya reducida y otra con dónde centras cada una. Solo en tu móvil.
import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { reducirImagen } from '../../../shared/platform/index.ts'
import { conFotoTuya, encuadresPlatos, fotos } from '../state/recetas.ts'

type FilaFoto = { id: string; target: 'foto-plato'; plato: string; imagen: Blob }
type FilaEncuadre = {
  id: string
  target: 'encuadre-platos'
  encuadres: Record<string, { x: number; y: number }>
}

/** El lado mayor de la foto guardada: de sobra para la cabecera y ligera. */
const LADO = 1200
const ID_ENCUADRES = 'encuadre-platos'
const idDe = (plato: string) => `foto-plato:${plato}`

/** La foto que traía cada plato antes de poner la tuya (para volver a ella al quitarla). */
const deAntes = new Map<string, string | undefined>()
/** Las fotos tuyas que se ven (para soltarlas de memoria al cambiarlas). */
const tuyas = new Map<string, string>()

function poner(plato: string, imagen: Blob | null) {
  const antes = tuyas.get(plato)
  if (antes) URL.revokeObjectURL(antes)
  if (!deAntes.has(plato)) deAntes.set(plato, fotos.value[plato])
  const resto = { ...fotos.value }
  delete resto[plato]
  if (imagen) {
    const url = URL.createObjectURL(imagen)
    tuyas.set(plato, url)
    conFotoTuya.value = [...tuyas.keys()]
    fotos.value = { ...resto, [plato]: url }
    return
  }
  tuyas.delete(plato)
  conFotoTuya.value = [...tuyas.keys()]
  const original = deAntes.get(plato)
  fotos.value = original ? { ...resto, [plato]: original } : resto
}

/** Tus fotos de los platos y dónde las centras (después de leer el recetario). */
export async function cargarFotosDePlatos(): Promise<void> {
  try {
    const db = await getDb()
    const filas = (await db.getAllFromIndex('userContent', 'target', 'foto-plato')) as FilaFoto[]
    for (const f of filas) poner(f.plato, f.imagen)
    const e = (await db.get('userContent', ID_ENCUADRES)) as FilaEncuadre | undefined
    encuadresPlatos.value = e?.encuadres ?? {}
  } catch (error) {
    logError(error, 'cargar las fotos de los platos')
  }
}

/** Pone tu foto a un plato (la de la galería o la cámara). Devuelve si se pudo. */
export async function ponerFotoDePlato(plato: string, archivo: Blob): Promise<boolean> {
  try {
    const imagen = await reducirImagen(archivo, LADO)
    const db = await getDb()
    const fila: FilaFoto = { id: idDe(plato), target: 'foto-plato', plato, imagen }
    await db.put('userContent', fila)
    poner(plato, imagen)
    return true
  } catch (error) {
    logError(error, 'poner la foto del plato')
    return false
  }
}

/** Quita tu foto de un plato: vuelve la que traía. */
export async function quitarFotoDePlato(plato: string): Promise<void> {
  try {
    const db = await getDb()
    await db.delete('userContent', idDe(plato))
    poner(plato, null)
  } catch (error) {
    logError(error, 'quitar la foto del plato')
  }
}

/** Guarda dónde centras la foto de un plato (en %). */
export async function centrarFotoDePlato(plato: string, x: number, y: number): Promise<void> {
  encuadresPlatos.value = { ...encuadresPlatos.value, [plato]: { x, y } }
  try {
    const db = await getDb()
    const fila: FilaEncuadre = {
      id: ID_ENCUADRES,
      target: 'encuadre-platos',
      encuadres: encuadresPlatos.value,
    }
    await db.put('userContent', fila)
  } catch (error) {
    logError(error, 'centrar la foto del plato')
  }
}
