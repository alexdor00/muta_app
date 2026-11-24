// API pública del área Comida: lo único que otras áreas pueden usar.
export type { ComidaParaProgreso } from './use-cases/forProgreso.ts'

/** Para Progreso: tu peso, tu semana de comida y tu cintura. Se descarga aparte al pedirlo. */
export async function comidaParaProgreso() {
  return (await import('./use-cases/forProgreso.ts')).comidaParaProgreso()
}

export type { NutricionParaEntreno } from './use-cases/forEntreno.ts'

/** Para el entrenador de Entreno: tu fase, la recarga, tu comida y cómo estás (las mismas reglas). Se descarga aparte. */
export async function nutricionParaEntreno(hoy: string) {
  return (await import('./use-cases/forEntreno.ts')).nutricionParaEntreno(hoy)
}

/** Cuánto cambió tu peso en un tramo (kg, de tendencia), o null sin pesajes (para «Rutina terminada» en Entreno). */
export async function cambioDePeso(desde: string, hasta: string) {
  return (await import('./use-cases/forEntreno.ts')).cambioDePeso(desde, hasta)
}
