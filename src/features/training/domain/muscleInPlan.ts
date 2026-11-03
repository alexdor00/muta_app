// Un músculo en tu plan (rutina-y-biblioteca.js · muOneHtml y motor.js · planVolume del prototipo): las series por semana
// que cuentan para su rango son las de los ejercicios que lo trabajan directo (aporta 1); los que aportan de 0,5 a menos
// de 1 lo trabajan de forma indirecta y se enseñan aparte, sin sumar.
import type { MuscleId, Range } from './muscles.ts'

/** Un ejercicio de una sesión de la semana: su sesión, sus series y lo que aporta a cada músculo. */
export type HuecoPlan = {
  /** El ejercicio en la biblioteca. */
  id: string
  sigla: string
  nombre: string
  series: number
  contributes: Partial<Record<MuscleId, number>>
}

export function muscleInPlan(semana: HuecoPlan[], m: MuscleId) {
  const directos = semana.filter((h) => (h.contributes[m] ?? 0) >= 1)
  const indirectos = semana.filter((h) => {
    const c = h.contributes[m] ?? 0
    return c >= 0.5 && c < 1
  })
  return { series: directos.reduce((n, h) => n + h.series, 0), directos, indirectos }
}

/** Hasta dónde llega la barra del rango: 20 como poco, y siempre con hueco para el máximo y para lo que hace tu plan. */
export function barMax(rango: Range, series: number): number {
  return Math.max(20, Math.ceil(rango[1] * 1.5), Math.ceil(series * 1.1))
}

/** Cómo va tu plan frente al rango, en una frase (muVerdict del prototipo). */
export function verdict(series: number, [lo, hi]: Range): string {
  if (!series) return 'Ningún ejercicio de tu plan lo trabaja directamente'
  if (series < lo) return lo - series === 1 ? 'Te falta 1 serie' : `Te faltan ${lo - series} series`
  if (series > hi) return series - hi === 1 ? 'Te pasas 1 serie' : `Te pasas ${series - hi} series`
  return 'Vas bien'
}

/** Mínimo o máximo a mano, de 0 a 40: el mínimo nunca pasa del máximo (si se cruzan, se mueve el otro). */
export function stepRange(rango: Range, cual: 0 | 1, paso: number): Range {
  const r: Range = [...rango]
  r[cual] = Math.min(40, Math.max(0, r[cual] + paso))
  if (r[0] > r[1]) {
    if (cual === 1) r[0] = r[1]
    else r[1] = r[0]
  }
  return r
}
