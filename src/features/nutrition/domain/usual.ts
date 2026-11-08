// Lo que sueles comer: la app aprende de tus apuntes de las dos últimas semanas (qué alimentos repites, cuánto y en qué
// comida) y, cuando al día le falta algo, te propone de eso mismo lo que mejor lo cubre. Solo propone: lo apuntas tú.
import { addDays } from '../../../shared/lib/format.ts'
import { macrosDe, type Alimento, type Apunte, type ComidaId, type Macros } from './food.ts'

/** Cuántos días mira hacia atrás y cuántos tienen que estar apuntados para aprender (sugerido). */
export const VENTANA_DIAS = 14
export const DIAS_PARA_APRENDER = 7
/** Cuántas veces tiene que salir un alimento para contar como tuyo (sugerido). */
export const VECES_MIN = 2

export type Habito = {
  alimentoId: string
  veces: number
  /** Lo que sueles echar (la mediana de tus apuntes en gramos). */
  gramos: number
  /** Cuántas veces en cada comida. */
  enComida: Partial<Record<ComidaId, number>>
}

const mediana = (xs: number[]) => {
  const o = [...xs].sort((a, b) => a - b)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2
}

/** Tus hábitos de las dos últimas semanas; null si aún no hay días apuntados suficientes para aprender. */
export function habitosDe(dias: Readonly<Record<string, readonly Apunte[]>>, hoyEs: string): Habito[] | null {
  const desde = addDays(hoyEs, -VENTANA_DIAS)
  const fechas = Object.keys(dias).filter((f) => f >= desde && f < hoyEs && dias[f].length > 0)
  if (fechas.length < DIAS_PARA_APRENDER) return null
  const por = new Map<string, { gramos: number[]; enComida: Partial<Record<ComidaId, number>> }>()
  for (const f of fechas)
    for (const a of dias[f]) {
      if (!a.alimentoId || !a.gramos) continue
      const h = por.get(a.alimentoId) ?? { gramos: [], enComida: {} }
      h.gramos.push(a.gramos)
      h.enComida[a.comida] = (h.enComida[a.comida] ?? 0) + 1
      por.set(a.alimentoId, h)
    }
  return [...por.entries()]
    .filter(([, h]) => h.gramos.length >= VECES_MIN)
    .map(([alimentoId, h]) => ({
      alimentoId,
      veces: h.gramos.length,
      gramos: Math.round(mediana(h.gramos) / 5) * 5,
      enComida: h.enComida,
    }))
    .sort((a, b) => b.veces - a.veces)
}

/** Lo que más falta del día, si falta algo que merezca la pena (sugerido: 15 g de proteína, 20 de hidratos, 8 de grasa). */
export function loQueFalta(falta: Macros): 'protein' | 'carbs' | 'fat' | null {
  if (falta.kcal < 100) return null
  if (falta.protein >= 15) return 'protein'
  if (falta.carbs >= 20) return 'carbs'
  if (falta.fat >= 8) return 'fat'
  return null
}

export type Propuesta = { alimento: Alimento; gramos: number; aporta: Macros }

/**
 * De tus hábitos, los que mejor cubren lo que más falta sin pasarte de las kcal que quedan: con lo que sueles echar
 * (o menos, de 5 en 5, si no cabe), primero los que sueles comer en esta comida y los que más aportan por kcal.
 */
export function deLoQueSueles(
  habitos: readonly Habito[],
  falta: Macros,
  comida: ComidaId,
  alimentoDe: (id: string) => Alimento | null,
  n = 3,
): Propuesta[] {
  const macro = loQueFalta(falta)
  if (!macro) return []
  return habitos
    .flatMap((h) => {
      const a = alimentoDe(h.alimentoId)
      if (!a || !(a[macro] > 0) || !(a.kcal > 0)) return []
      // Lo que sueles echar, o menos si se pasa de las kcal que quedan o de lo que falta de ese macro (de 5 en 5)
      const tope = Math.min((falta.kcal * 100) / a.kcal, (falta[macro] * 1.1 * 100) / a[macro])
      const gramos = Math.floor(Math.min(h.gramos, tope) / 5) * 5
      if (gramos < Math.max(5, h.gramos * 0.5)) return []
      const aporta = macrosDe(a, gramos)
      const densidad = (a[macro] * (macro === 'fat' ? 9 : 4)) / a.kcal
      const puntos = densidad + (h.enComida[comida] ? 0.3 : 0) + Math.min(h.veces, 10) * 0.02
      return [{ alimento: a, gramos, aporta, puntos }]
    })
    .sort((x, y) => y.puntos - x.puntos)
    .slice(0, n)
    .map(({ alimento, gramos, aporta }) => ({ alimento, gramos, aporta }))
}
