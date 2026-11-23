import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { sinClaves } from '../../../shared/lib/object.ts'
import { reducirImagen } from '../../../shared/platform/index.ts'
import { repartirFotos, rutaFotoDeSerie, tipoDeSesion } from '../domain/sessionDefaultPhoto.ts'
import { encuadres, fotosDeSerie, fotosSesion } from '../state/fotos.ts'
import { tuPlan } from '../state/plan.ts'

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
    const encuadre = (await db.get('userContent', idDeEncuadre(programId))) as FilaEncuadre | undefined
    encuadres.value = encuadre?.encuadres ?? {}
  } catch (error) {
    logError(error, 'cargar las fotos de las sesiones')
  }
}

/** Pone tu foto a una sesión (la de la galería o la cámara). Devuelve si se pudo. */
export async function ponerFoto(programId: string, sigla: string, archivo: Blob): Promise<boolean> {
  try {
    const imagen = await reducirImagen(archivo, LADO)
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

/** Las fotos de las sesiones de una rutina (sigla → imagen), sin tocar las de Tu plan. Vacío si algo falla. */
export async function fotosDeRutina(programId: string): Promise<Record<string, Blob>> {
  try {
    const db = await getDb()
    const filas = (await db.getAllFromIndex('userContent', 'target', 'foto-sesion')) as FilaFoto[]
    return Object.fromEntries(filas.filter((f) => f.programId === programId).map((f) => [f.sigla, f.imagen]))
  } catch (error) {
    logError(error, 'leer las fotos de una rutina')
    return {}
  }
}

// Las fotos de serie de una rutina: una fila en `userContent` con la que le tocó a cada sesión.
type FilaFotosDeSerie = {
  id: string
  target: 'fotos-de-serie'
  programId: string
  fotos: Record<string, string>
}
const idDeSerie = (programId: string) => `fotos-de-serie:${programId}`

/**
 * Reparte las fotos de serie de tu semana: las sesiones que ya tenían una la conservan; las nuevas (la primera vez o una
 * sesión que añadiste) cogen al azar una de su tipo. Se guarda, así no cambia nunca.
 */
export async function repartirFotosDeSerie(programId: string): Promise<void> {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return
  try {
    const db = await getDb()
    const fila = (await db.get('userContent', idDeSerie(programId))) as FilaFotosDeSerie | undefined
    const antes = fila?.fotos ?? {}
    const fotos = repartirFotos(
      plan.semana.map((x) => ({ sigla: x.sigla, tipo: tipoDeSesion(x.ejercicios) })),
      antes,
    )
    fotosDeSerie.value = fotos
    const nuevas = Object.keys(fotos).some((k) => fotos[k] !== antes[k])
    if (nuevas) {
      const guardar: FilaFotosDeSerie = {
        id: idDeSerie(programId),
        target: 'fotos-de-serie',
        programId,
        fotos: { ...antes, ...fotos },
      }
      await db.put('userContent', guardar)
    }
  } catch (error) {
    logError(error, 'repartir las fotos de las sesiones')
  }
}

/** La foto de serie de una sesión de esa rutina (para un día de Progreso); la de cuerpo completo si aún no tiene. */
export async function fotoDeSerieDe(programId: string, sigla: string): Promise<string> {
  try {
    const db = await getDb()
    const fila = (await db.get('userContent', idDeSerie(programId))) as FilaFotosDeSerie | undefined
    return rutaFotoDeSerie(fila?.fotos[sigla] ?? 'completo-1')
  } catch {
    return rutaFotoDeSerie('completo-1')
  }
}

/** Elige otra de las fotos de serie para una sesión (quita la tuya si la tenía) y la guarda. */
export async function elegirFotoDeSerie(programId: string, sigla: string, foto: string): Promise<void> {
  try {
    const db = await getDb()
    if (fotosSesion.value[sigla]) await quitarFoto(programId, sigla)
    const fila = (await db.get('userContent', idDeSerie(programId))) as FilaFotosDeSerie | undefined
    const fotos = { ...(fila?.fotos ?? {}), [sigla]: foto }
    const guardar: FilaFotosDeSerie = { id: idDeSerie(programId), target: 'fotos-de-serie', programId, fotos }
    await db.put('userContent', guardar)
    fotosDeSerie.value = { ...fotosDeSerie.value, [sigla]: foto }
  } catch (error) {
    logError(error, 'elegir la foto de la sesión')
  }
}

// Dónde centras la foto de cada sesión: una fila por rutina.
type FilaEncuadre = {
  id: string
  target: 'encuadre-foto'
  programId: string
  encuadres: Record<string, { x: number; y: number }>
}
const idDeEncuadre = (programId: string) => `encuadre-foto:${programId}`

/** Guarda dónde centras la foto de una sesión (en %), la tuya o la de la app. */
export async function centrarFoto(programId: string, sigla: string, x: number, y: number): Promise<void> {
  encuadres.value = { ...encuadres.value, [sigla]: { x, y } }
  try {
    const db = await getDb()
    const fila: FilaEncuadre = {
      id: idDeEncuadre(programId),
      target: 'encuadre-foto',
      programId,
      encuadres: encuadres.value,
    }
    await db.put('userContent', fila)
  } catch (error) {
    logError(error, 'centrar la foto de la sesión')
  }
}

/** Para un día de Progreso: dónde centraste la foto de esa sesión («50% 30%»). */
export async function encuadreDeEntreno(programId: string, sigla: string): Promise<string> {
  try {
    const db = await getDb()
    const fila = (await db.get('userContent', idDeEncuadre(programId))) as FilaEncuadre | undefined
    const e = fila?.encuadres[sigla]
    return e ? `${e.x}% ${e.y}%` : '50% 50%'
  } catch {
    return '50% 50%'
  }
}
