// Lo que Progreso da a otras áreas (lo de Hoy va en paraHoy.ts).

export type { CuerpoParaComida } from './use-cases/forComida.ts'

/** Para la revisión semanal de Comida: tus perímetros, cómo estás y tu grasa. Se descarga aparte al pedirlo. */
export async function cuerpoParaComida(d: {
  sexo: 'hombre' | 'mujer'
  alturaCm: number
  pesoKg: number
  ritmoPct: number | null
}) {
  return (await import('./use-cases/forComida.ts')).cuerpoParaComida(d)
}
