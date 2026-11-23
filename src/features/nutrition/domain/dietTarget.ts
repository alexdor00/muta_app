// Tu objetivo con una dieta: cuánto moverla para llegar a tus kcal (se propone al cambiar tu objetivo; solo se aplica si
// lo aceptas, como las propuestas de la consulta).
import type { TipoDia } from './diet.ts'

/**
 * Cuánto mover las kcal de tu dieta (la media de cada tipo de día) para llegar a tu objetivo, en decenas como los gramos
 * de la consulta. Lo absorbe la receta que ajusta, igual que una propuesta de la consulta. Con `mediaSemanal` (los días de
 * entreno de tu semana; tu objetivo no distingue el tipo de día) se mueven igual los dos: la dieta conserva su reparto
 * entre entreno y descanso y su media semanal llega a la tuya. null si ya coincide.
 */
export function cambioHaciaObjetivo(
  dieta: Record<TipoDia, number>,
  objetivo: Record<TipoDia, number>,
  mediaSemanal: number | null = null,
): Record<TipoDia, number> | null {
  const de10 = (n: number) => Math.round(n / 10) * 10
  const media = (x: Record<TipoDia, number>, n: number) => (x.entreno * n + x.descanso * (7 - n)) / 7
  const igual =
    mediaSemanal === null ? null : de10(media(objetivo, mediaSemanal) - media(dieta, mediaSemanal))
  const d = (t: TipoDia) => igual ?? de10(objetivo[t] - dieta[t])
  const cambio = { entreno: d('entreno'), descanso: d('descanso') }
  return cambio.entreno || cambio.descanso ? cambio : null
}
