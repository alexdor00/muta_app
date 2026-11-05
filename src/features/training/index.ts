// API pública del área Entreno: lo único que otras áreas pueden usar.
export { TuMaterial } from './screens/material/TuMaterial.tsx'
export type { FuerzaBasicos } from './domain/strengthTrend.ts'

/** Para Comida: qué días son de entreno según tu rutina (null sin rutina). Se descarga aparte al pedirlo. */
export async function tiposDeDia(hoy: string, inicio: string, n: number) {
  return (await import('./use-cases/forComida.ts')).tiposDeDia(hoy, inicio, n)
}

/** Para la consulta de Comida: cómo va tu fuerza en los básicos. Se descarga aparte al pedirlo. */
export async function fuerzaEnBasicos(hoy: string) {
  return (await import('./use-cases/forComida.ts')).fuerzaParaComida(hoy)
}
