import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { sinClaves } from '../../../shared/lib/object.ts'
import { fotosSesion } from '../state/fotos.ts'

// En `userContent`, una fila por sesión de tu rutina con la imagen ya reducida. Solo en tu móvil.
type FilaFoto = { id: string; target: 'foto-sesion'; programId: string; sigla: string; imagen: Blob }

/** El lado mayor de la foto guardada: de sobra para la tarjeta y ligera. */
const LADO = 1200

const idDe = (programId: string, sigla: string) => `foto:${programId}:${sigla}`

function poner(sigla: string, imagen: Blob | null) {
  const antes = fotosSesion.value[sigla]
  if (antes) URL.revokeObjectURL(antes)
  const resto = sinClaves(fotosSesion.value, [sigla])
  fotosSesion.value = imagen ? { ...resto, [sigla]: URL.createObjectURL(imagen) } : resto
}

/** Las fotos de las sesiones de esta rutina (las de otra rutina se quedan guardadas, sin enseñar). */
export async function cargarFotos(programId: string): Promise<void> {
  try {
    const db = await getDb()
    const filas = (await db.getAllFromIndex('userContent', 'target', 'foto-sesion')) as FilaFoto[]
    for (const url of Object.values(fotosSesion.value)) URL.revokeObjectURL(url)
    fotosSesion.value = {}
    for (const f of filas) if (f.programId === programId) poner(f.sigla, f.imagen)
  } catch (error) {
    logError(error, 'cargar las fotos de las sesiones')
  }
}

/** La imagen, con su lado mayor en `LADO` como mucho y en JPEG (una foto del móvil pesa varios megas). */
async function reducir(archivo: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(archivo)
  const escala = Math.min(1, LADO / Math.max(bmp.width, bmp.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(bmp.width * escala)
  lienzo.height = Math.round(bmp.height * escala)
  lienzo.getContext('2d')?.drawImage(bmp, 0, 0, lienzo.width, lienzo.height)
  bmp.close()
  return new Promise((ok) => lienzo.toBlob((b) => ok(b ?? archivo), 'image/jpeg', 0.85))
}

/** Pone tu foto a una sesión (la de la galería o la cámara). Devuelve si se pudo. */
export async function ponerFoto(programId: string, sigla: string, archivo: Blob): Promise<boolean> {
  try {
    const imagen = await reducir(archivo)
    const db = await getDb()
    const fila: FilaFoto = { id: idDe(programId, sigla), target: 'foto-sesion', programId, sigla, imagen }
    await db.put('userContent', fila)
    poner(sigla, imagen)
    return true
  } catch (error) {
    logError(error, 'poner la foto de la sesión')
    return false
  }
}

/** Quita la foto de una sesión: vuelve su color. */
export async function quitarFoto(programId: string, sigla: string): Promise<void> {
  try {
    const db = await getDb()
    await db.delete('userContent', idDe(programId, sigla))
    poner(sigla, null)
  } catch (error) {
    logError(error, 'quitar la foto de la sesión')
  }
}
