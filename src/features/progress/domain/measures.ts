// Tus medidas: los perímetros que pide la guía para no decidir solo con la báscula (brazo, pecho, cintura y muslo;
// docs/conocimiento/04-guia-culturismo-natural.md § 6) y los de «Medidas del mes» (gemelo, cadera y cuello;
// docs/conocimiento/01-contenido.md § 9), que además sirven para estimar tu grasa. Cómo tomar cada una, de esa tabla.
// La cintura de la consulta de Comida cuenta también.
import { addDays, daysBetween } from '../../../shared/lib/format.ts'

export const PERIMETROS = [
  {
    id: 'brazo',
    nombre: 'Brazo',
    como: 'Bíceps contraído, en el punto más ancho, a mitad entre hombro y codo.',
  },
  { id: 'pecho', nombre: 'Pecho', como: 'A la altura de los pezones, bajo las axilas, tras soltar el aire.' },
  {
    id: 'cintura',
    nombre: 'Cintura',
    como: 'A la altura del ombligo, relajado, al soltar el aire. Sin meter tripa.',
  },
  {
    id: 'muslo',
    nombre: 'Muslo',
    como: 'A mitad entre la ingle y la rodilla, de pie y con el peso repartido.',
  },
  { id: 'gemelo', nombre: 'Gemelo', como: 'En la parte más ancha, de pie.' },
  { id: 'cadera', nombre: 'Cadera', como: 'En la parte más ancha de los glúteos, con los pies juntos.' },
  {
    id: 'cuello',
    nombre: 'Cuello',
    como: 'Justo bajo la nuez, con la cinta algo inclinada hacia abajo por delante.',
  },
] as const

export type PerimetroId = (typeof PERIMETROS)[number]['id']

/** Lo que apuntas un día, en cm (solo las que mediste). */
export type Medida = { date: string } & Partial<Record<PerimetroId, number>>

export type Punto = { date: string; cm: number }

export type ResumenPerimetro = {
  cm: number
  fecha: string
  /** La primera vez que lo mediste y cuánto ha cambiado desde entonces (null si solo hay una). */
  desde: string | null
  cambio: number | null
  /** Cuánto ha cambiado frente a la vez anterior (null si solo hay una). */
  anterior: number | null
  /** Las últimas medidas (8 como mucho), para su mini-gráfica. */
  ultimas: number[]
}

/** Un perímetro en cm es razonable entre estos dos números. */
export const LIMITES_CM = { min: 15, max: 250 } as const

/** Cada cuántos días tocan las medidas y las fotos (docs/conocimiento/02-reglas.md § 9, «Checklist»: mensual). */
export const CADA_DIAS = 28

/** La serie de un perímetro, por fecha; la cintura suma la de la consulta (si el mismo día hay dos, manda la medida). */
export function serieDe(
  id: PerimetroId,
  medidas: readonly Medida[],
  cinturas: readonly Punto[] = [],
): Punto[] {
  const porDia = new Map<string, number>()
  if (id === 'cintura') for (const c of cinturas) porDia.set(c.date, c.cm)
  for (const m of medidas) {
    const cm = m[id]
    if (cm) porDia.set(m.date, cm)
  }
  return [...porDia.entries()]
    .map(([date, cm]) => ({ date, cm }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Cada perímetro: la última medida, el cambio frente a la anterior y desde la primera, y las últimas; null si nunca lo mediste. */
export function resumenMedidas(
  medidas: readonly Medida[],
  cinturas: readonly Punto[] = [],
): Record<PerimetroId, ResumenPerimetro | null> {
  const fila = (id: PerimetroId): ResumenPerimetro | null => {
    const s = serieDe(id, medidas, cinturas)
    const ultima = s.at(-1)
    if (!ultima) return null
    const primera = s[0]
    const dos = s.length > 1
    return {
      cm: ultima.cm,
      fecha: ultima.date,
      desde: dos ? primera.date : null,
      cambio: dos ? Math.round((ultima.cm - primera.cm) * 10) / 10 : null,
      anterior: dos ? Math.round((ultima.cm - s[s.length - 2].cm) * 10) / 10 : null,
      ultimas: s.slice(-8).map((p) => p.cm),
    }
  }
  return Object.fromEntries(PERIMETROS.map((p) => [p.id, fila(p.id)])) as Record<
    PerimetroId,
    ResumenPerimetro | null
  >
}

/** La última medida de un perímetro en esa fecha o antes (null si no hay). */
export function ultimaHasta(serie: readonly Punto[], fecha: string): number | null {
  let cm: number | null = null
  for (const p of serie) if (p.date <= fecha) cm = p.cm
  return cm
}

/** Cuántos días tiene el mes `mes` («2026-11» → 30): los que puedes elegir para tus medidas y fotos. */
export function diasDelMes(mes: string): number {
  const [a, m] = mes.split('-').map(Number)
  return new Date(a, m, 0).getDate()
}

/** Ese día del mes `mes` («2026-11»); si el mes es más corto (el 31 en noviembre), su último día. */
const elDia = (mes: string, dia: number) =>
  `${mes}-${String(Math.min(dia, diasDelMes(mes))).padStart(2, '0')}`

/** El mes `n` meses antes o después de `mes` («2026-11»). */
function mesMas(mes: string, n: number): string {
  const [a, m] = mes.split('-').map(Number)
  const d = new Date(a, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Cuándo tocan tus medidas y tus fotos (medidas o fotos, la más reciente). Con tu día del mes elegido: «ahora» desde ese
 * día hasta que las hagas; si no, en cuántos días toca el siguiente. Sin día elegido: a los 28 días de la última vez.
 * Nunca hechas: ahora.
 */
export function cuandoToca(
  fechas: readonly string[],
  hoy: string,
  dia: number | null = null,
): { ahora: boolean; enDias: number; ultima: string | null } {
  const ultima = fechas.reduce<string | null>((a, f) => (a && a > f ? a : f), null)
  if (!ultima) return { ahora: true, enDias: 0, ultima: null }
  if (dia === null) {
    const enDias = daysBetween(hoy, addDays(ultima, CADA_DIAS))
    return { ahora: enDias <= 0, enDias: Math.max(0, enDias), ultima }
  }
  // El último día elegido que ya llegó (este mes o el pasado) y el siguiente
  const mes = hoy.slice(0, 7)
  const llego = elDia(mes, dia) <= hoy ? elDia(mes, dia) : elDia(mesMas(mes, -1), dia)
  const siguiente = elDia(mesMas(llego.slice(0, 7), 1), dia)
  if (ultima < llego) return { ahora: true, enDias: 0, ultima }
  return { ahora: false, enDias: daysBetween(hoy, siguiente), ultima }
}
