// Tus mesociclos en Progreso: el detalle de uno, la comparación de dos y lo que se hace con ellos (renombrar, empezar
// otro, volver a usar una rutina) y elegir el básico de un grupo de «Récords». Todo lo calcula y guarda Entreno (por su
// index.ts); el peso de cada tramo sale de tus pesajes de Comida.
import { logError } from '../../../shared/lib/logger.ts'
import {
  compararMesociclos,
  empezarMesociclo,
  mesocicloParaProgreso,
  renombrarMesociclo,
  volverAUsarMesociclo,
  type Comparacion,
  type PesoEnTramo,
} from '../../training/index.ts'
import { comida, detalle, fotosRutina, hoy } from '../state/progreso.ts'
import { cargarProgreso } from './progress.ts'

/** Tu peso de tendencia al empezar y al acabar un tramo (el primero desde `desde` y el último hasta `hasta`). */
const pesoEnTramo: PesoEnTramo = (desde, hasta) => {
  const dentro = (comida.value?.serie ?? []).filter((p) => p.date >= desde && p.date <= hasta)
  const [a, b] = [dentro[0], dentro.at(-1)]
  return a && b && a !== b ? { inicio: a.tendencia, fin: b.tendencia } : null
}

/** Abre el detalle de un mesociclo (carga Progreso si hace falta). */
export async function abrirMesociclo(id: string): Promise<void> {
  detalle.value = 'cargando'
  try {
    if (!comida.value) await cargarProgreso()
    const d = await mesocicloParaProgreso(id, hoy.value, pesoEnTramo)
    for (const url of Object.values(fotosRutina.value)) URL.revokeObjectURL(url)
    fotosRutina.value = Object.fromEntries(
      (d?.rutina ?? []).flatMap((x) => (x.foto ? [[x.sigla, URL.createObjectURL(x.foto)]] : [])),
    )
    detalle.value = d
  } catch (error) {
    logError(error, 'abrir un mesociclo')
    detalle.value = null
  }
}

export async function renombrar(id: string, nombre: string): Promise<boolean> {
  const ok = await renombrarMesociclo(id, nombre)
  if (ok) await Promise.all([abrirMesociclo(id), cargarProgreso()])
  return ok
}

/** Empieza hoy otro mesociclo con tu rutina: el de ahora se archiva. */
export async function empezarOtro(nombre: string): Promise<boolean> {
  const ok = await empezarMesociclo(nombre, hoy.value)
  if (ok) await cargarProgreso()
  return ok
}

/** Vuelve a usar la rutina de un mesociclo archivado. */
export async function volverAUsar(id: string): Promise<boolean> {
  const ok = await volverAUsarMesociclo(id, hoy.value)
  if (ok) await cargarProgreso()
  return ok
}

/** Dos mesociclos comparados por semana (null si alguno no existe o algo falla). */
export async function comparar(a: string, b: string): Promise<Comparacion | null> {
  try {
    return await compararMesociclos(a, b, hoy.value, pesoEnTramo)
  } catch (error) {
    logError(error, 'comparar mesociclos')
    return null
  }
}
