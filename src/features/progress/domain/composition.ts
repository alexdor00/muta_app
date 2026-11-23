// Composición corporal estimada con tus medidas (docs/conocimiento/02-reglas.md § 9, «Composición corporal»: fórmula de la
// Marina de EE. UU., Hodgdon y Beckett 1984, con las medidas en pulgadas). Calibración opcional con una medida real: se
// guarda la diferencia. Rango ±3,5 puntos (±2 calibrado); mínimo 3 %. Magra = peso de tendencia × (1 − grasa). FFMI =
// magra ÷ altura², corregido a 1,80 m. Objetivo de grasa: 8·10·12·15 % (hombre), 18·20·22·25 % (mujer); peso a ese
// objetivo = magra ÷ (1 − objetivo). MUTA no baja del ~8 % (decisión 2026-11-09).
import { ultimaHasta, type Punto } from './measures.ts'

type Sexo = 'hombre' | 'mujer'

const PULGADA = 2.54

export const OBJETIVOS_GRASA: Record<Sexo, readonly number[]> = {
  hombre: [8, 10, 12, 15],
  mujer: [18, 20, 22, 25],
}

/** Lo que hace falta medir para estimarla: cuello y cintura y, en mujeres, también la cadera. */
export const NECESARIAS: Record<Sexo, ('cuello' | 'cintura' | 'cadera')[]> = {
  hombre: ['cuello', 'cintura'],
  mujer: ['cuello', 'cintura', 'cadera'],
}

/** % de grasa con la fórmula de la Marina (sin calibrar); null si las medidas no dan (cintura menor que el cuello…). */
export function grasaMarina(
  sexo: Sexo,
  alturaCm: number,
  cm: { cuello: number; cintura: number; cadera: number | null },
): number | null {
  const pulg = (x: number) => x / PULGADA
  const altura = pulg(alturaCm)
  let pct: number
  if (sexo === 'hombre') {
    const d = pulg(cm.cintura - cm.cuello)
    if (d <= 0) return null
    pct = 86.01 * Math.log10(d) - 70.041 * Math.log10(altura) + 36.76
  } else {
    if (cm.cadera === null) return null
    const d = pulg(cm.cintura + cm.cadera - cm.cuello)
    if (d <= 0) return null
    pct = 163.205 * Math.log10(d) - 97.684 * Math.log10(altura) - 78.387
  }
  return Number.isFinite(pct) ? pct : null
}

/** Tu calibración: lo que dio una medida real (DEXA, pliegues…) menos lo que estimaba la fórmula ese día. */
export type Calibracion = { medido: number; diferencia: number; fecha: string }

export type Composicion = {
  /** % de grasa (calibrado si hay calibración), con su rango probable. */
  grasa: number
  rango: [number, number]
  calibrado: boolean
  /** La de la fórmula, sin calibrar (para calibrar después). */
  bruta: number
  magraKg: number
  grasaKg: number
  ffmi: number
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Tu composición con tu peso de tendencia; null si falta algo o la fórmula no da. */
export function composicionDe(datos: {
  sexo: Sexo
  alturaCm: number
  pesoKg: number
  cuello: number | null
  cintura: number | null
  cadera: number | null
  calibracion: Calibracion | null
}): Composicion | null {
  const { sexo, alturaCm, pesoKg, cuello, cintura, cadera, calibracion } = datos
  if (!cuello || !cintura || !alturaCm || !pesoKg) return null
  const bruta = grasaMarina(sexo, alturaCm, { cuello, cintura, cadera })
  if (bruta === null) return null
  const grasa = Math.max(3, bruta + (calibracion?.diferencia ?? 0))
  const margen = calibracion ? 2 : 3.5
  const magraKg = pesoKg * (1 - grasa / 100)
  const metros = alturaCm / 100
  return {
    grasa: r1(grasa),
    rango: [r1(Math.max(3, grasa - margen)), r1(grasa + margen)],
    calibrado: Boolean(calibracion),
    bruta: r1(bruta),
    magraKg: r1(magraKg),
    grasaKg: r1(pesoKg - magraKg),
    ffmi: r1(magraKg / metros ** 2 + 6.1 * (1.8 - metros)),
  }
}

/** El peso que tendrías con ese % de grasa conservando tu masa magra. */
export const pesoConGrasa = (magraKg: number, objetivoPct: number) => r1(magraKg / (1 - objetivoPct / 100))

/**
 * Semanas hasta un peso a tu ritmo (% del peso por semana, con signo): ln(objetivo ÷ peso) ÷ ln(1 + ritmo/100)
 * (docs/conocimiento/02-reglas.md § 8, «Peso objetivo»). null si el ritmo no va hacia él.
 */
export function semanasHasta(pesoKg: number, objetivoKg: number, ritmoPct: number): number | null {
  if (!ritmoPct || objetivoKg === pesoKg || Math.sign(objetivoKg - pesoKg) !== Math.sign(ritmoPct))
    return null
  return Math.ceil(Math.log(objetivoKg / pesoKg) / Math.log(1 + ritmoPct / 100))
}

/**
 * La evolución de tu grasa y tu masa magra: un punto por cada día que mediste el cuello, con la cintura (y la cadera) de
 * ese día o la última de antes y tu peso de tendencia de entonces.
 */
export function evolucionDe(datos: {
  sexo: Sexo
  alturaCm: number
  cuello: readonly Punto[]
  cintura: readonly Punto[]
  cadera: readonly Punto[]
  peso: readonly { date: string; tendencia: number }[]
  calibracion: Calibracion | null
}): { date: string; grasa: number; magraKg: number }[] {
  return datos.cuello.flatMap((c) => {
    const peso = datos.peso.filter((p) => p.date <= c.date).at(-1)?.tendencia ?? null
    if (!peso) return []
    const x = composicionDe({
      sexo: datos.sexo,
      alturaCm: datos.alturaCm,
      pesoKg: peso,
      cuello: c.cm,
      cintura: ultimaHasta(datos.cintura, c.date),
      cadera: ultimaHasta(datos.cadera, c.date),
      calibracion: datos.calibracion,
    })
    return x ? [{ date: c.date, grasa: x.grasa, magraKg: x.magraKg }] : []
  })
}
