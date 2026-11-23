// API pública del área Comida: lo único que otras áreas pueden usar.
export type { ComidaParaProgreso } from './use-cases/forProgreso.ts'

/** Para Progreso: tu peso, tu semana de comida y tu cintura. Se descarga aparte al pedirlo. */
export async function comidaParaProgreso() {
  return (await import('./use-cases/forProgreso.ts')).comidaParaProgreso()
}
