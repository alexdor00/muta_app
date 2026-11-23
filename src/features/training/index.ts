// API pública del área Entreno: lo único que otras áreas pueden usar.
export { TuMaterial } from './screens/material/TuMaterial.tsx'
import type { PesoEnTramo } from './use-cases/forProgreso.ts'
export type { FuerzaBasicos } from './domain/strengthTrend.ts'
export type { Rendimiento } from './domain/rendimiento.ts'

/** Para Comida: qué días son de entreno según tu rutina (null sin rutina). Se descarga aparte al pedirlo. */
export async function tiposDeDia(hoy: string, inicio: string, n: number) {
  return (await import('./use-cases/forComida.ts')).tiposDeDia(hoy, inicio, n)
}

/** Para la consulta de Comida: cómo va tu fuerza en los básicos. Se descarga aparte al pedirlo. */
export async function fuerzaEnBasicos(hoy: string) {
  return (await import('./use-cases/forComida.ts')).fuerzaParaComida(hoy)
}

/** Para la recarga de hidratos de Comida: tu rendimiento reciente y las sesiones de una vuelta de tu rutina. */
export async function rendimientoReciente(hoy: string) {
  return (await import('./use-cases/forComida.ts')).rendimientoParaComida(hoy)
}

export type {
  Comparacion,
  DetalleMeso,
  EntrenoDelDia,
  EntrenoParaProgreso,
  PesoEnTramo,
  TarjetaMeso,
} from './use-cases/forProgreso.ts'
export type { SerieHecha } from './domain/workoutSet.ts'

/**
 * Para Progreso: tus semanas de entreno, tu racha, tu fuerza, tus marcas, tus mesociclos, tus entrenos (el calendario) y
 * el récord del básico de cada grupo. Se descarga aparte al pedirlo.
 */
export async function entrenoParaProgreso(hoy: string) {
  return (await import('./use-cases/forProgreso.ts')).entrenoParaProgreso(hoy)
}

/** Para un día de Progreso: tu foto de esa sesión (null si no pusiste ninguna: va la de serie de su tono). */
export async function fotoDeEntreno(programId: string, sigla: string) {
  return (await import('./use-cases/forProgreso.ts')).fotoDeEntreno(programId, sigla)
}

/** Para un día de Progreso: la foto de serie que le tocó a esa sesión (si no pusiste la tuya). */
export async function fotoDeSerieDe(programId: string, sigla: string) {
  return (await import('./use-cases/forProgreso.ts')).fotoDeSerieDe(programId, sigla)
}

/** Para un día de Progreso: dónde centraste la foto de esa sesión. */
export async function encuadreDeEntreno(programId: string, sigla: string) {
  return (await import('./use-cases/forProgreso.ts')).encuadreDeEntreno(programId, sigla)
}

/** Para Progreso: el detalle de un mesociclo (constancia, músculos, intensidad, rutina y balance). */
export async function mesocicloParaProgreso(id: string, hoy: string, peso: PesoEnTramo) {
  return (await import('./use-cases/forProgreso.ts')).mesocicloParaProgreso(id, hoy, peso)
}

/** Para Progreso: dos mesociclos comparados por semana. */
export async function compararMesociclos(a: string, b: string, hoy: string, peso: PesoEnTramo) {
  return (await import('./use-cases/forProgreso.ts')).compararParaProgreso(a, b, hoy, peso)
}

/** Para Progreso: renombrar un mesociclo, empezar otro, volver a usar una rutina y elegir el básico de un grupo. */
export async function renombrarMesociclo(id: string, nombre: string) {
  return (await import('./use-cases/mesocycles.ts')).renombrarMesociclo(id, nombre)
}
export async function empezarMesociclo(nombre: string, hoy: string) {
  return (await import('./use-cases/mesocycles.ts')).empezarMesociclo(nombre, hoy)
}
export async function volverAUsarMesociclo(id: string, hoy: string) {
  return (await import('./use-cases/mesocycles.ts')).volverAUsarMesociclo(id, hoy)
}
