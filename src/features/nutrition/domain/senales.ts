// Las señales del entrenador (usuario, 2026-11-22: «como un entrenador real», cuestionario 1–16 y 19): además de la
// báscula, tu cintura y tus perímetros, cómo estás (¿Cómo estás hoy?), tus fines de semana, tu proteína y tu déficit.
// Umbrales de docs/conocimiento/02-reglas.md (§ 5, señales de mala recuperación; § 8, consulta: reglas 4, 5, 6 y 8) y de
// la guía (§ 7: refeeds según hambre, rendimiento y sueño; si la definición se atraganta, mantenimiento). Nada cambia
// solo: esto lo usa la revisión para proponer o para no apretar.
import { addDays } from '../../../shared/lib/format.ts'
import type { Fase } from './targets.ts'

/** Cómo estabas un día (¿Cómo estás hoy?, de Progreso): 0, 1 o 2, la primera, la del medio o la última respuesta. */
export type Animo = {
  date: string
  sueno?: number
  energia?: number
  hambre?: number
  estres?: number
  digestiones?: number
}

/** Tus perímetros de un día, en cm. */
export type Perimetros = { date: string; cintura?: number; brazo?: number; muslo?: number; pecho?: number }

/**
 * La respuesta que es mala en cada pregunta (§ 5: sueño < 6 h, energía baja; regla 8: hambre alta; la guía: estrés). Las
 * digestiones no cuentan como señal: dan consejo, no frenan.
 */
const MALA = { sueno: 0, energia: 0, hambre: 2, estres: 2 } as const
export type Senal = keyof typeof MALA

export const NOMBRE_SENAL: Record<Senal, string> = {
  sueno: 'duermes poco',
  energia: 'vas sin energía',
  hambre: 'pasas mucha hambre',
  estres: 'tienes mucho estrés',
}

/** Señales malas para frenar los cambios (§ 5: con 2, «recuperación justa»). */
export const SENALES_PARA_FRENAR = 2
/** Semanas seguidas con señales y bajando lento para proponer una pausa (sugerido: la guía no da cifra). */
export const SEMANAS_ATRAGANTADA = 3
/** La cintura que basta para no tocar nada aunque la báscula vaya lenta (regla 5). */
export const CINTURA_BAJA = -0.5
/** Más rápido que esto (% del peso por semana) es mala señal (§ 5). */
export const RAPIDO_PCT = 1.2
/** Proteína mínima de media en 7 días, en g por kilo (§ 5). */
export const PROTEINA_MINIMA = 1.4
/** Comer menos que esto de lo que gastas es un déficit excesivo (§ 5). */
export const DEFICIT_MAXIMO = 0.75
/** Fuerza en tus básicos que pide +150 kcal en hidratos (regla 4) y, en la fase final, consejo (regla 6). */
export const FUERZA_BAJA = -0.03
export const FUERZA_BAJA_FINAL = -0.02
/** A cuántos puntos de tu grasa objetivo empieza la fase final (regla 6). */
export const PUNTOS_FINAL = 3

/**
 * Las señales malas de una semana (los 7 días hasta `hasta`): cuenta la que sale en la mitad o más de los días que
 * contestaste, si contestaste al menos 3.
 */
export function senalesDeLaSemana(animo: readonly Animo[], hasta: string): Senal[] {
  const semana = animo.filter((x) => x.date > addDays(hasta, -7) && x.date <= hasta)
  return (Object.keys(MALA) as Senal[]).filter((k) => {
    const contestados = semana.filter((x) => x[k] !== undefined)
    return (
      contestados.length >= 3 && contestados.filter((x) => x[k] === MALA[k]).length * 2 >= contestados.length
    )
  })
}

/** Cuántas semanas seguidas, hasta hoy, llevas con señales para frenar. */
export function semanasConSenales(
  animo: readonly Animo[],
  hoy: string,
  maximo = SEMANAS_ATRAGANTADA,
): number {
  let n = 0
  while (n < maximo && senalesDeLaSemana(animo, addDays(hoy, -7 * n)).length >= SENALES_PARA_FRENAR) n++
  return n
}

/**
 * Cuánto cambió un perímetro: tu última medida (de las 2 últimas semanas) frente a la anterior de al menos 10 días antes
 * (y no más de 5 semanas). null si no hay dos.
 */
export function cambioDePerimetro(
  medidas: readonly Perimetros[],
  id: 'cintura' | 'brazo' | 'muslo' | 'pecho',
  hoy: string,
): number | null {
  const con = medidas.filter((x) => x[id] !== undefined && x.date <= hoy)
  const ultima = con.at(-1)
  if (!ultima || ultima.date < addDays(hoy, -14)) return null
  const antes = [...con]
    .reverse()
    .find((x) => x.date <= addDays(ultima.date, -10) && x.date >= addDays(ultima.date, -35))
  if (!antes) return null
  return Math.round(((ultima[id] ?? 0) - (antes[id] ?? 0)) * 10) / 10
}

const esFinde = (fecha: string) => [0, 6].includes(new Date(`${fecha}T12:00:00Z`).getUTCDay())

/**
 * Te pasas los fines de semana y entre semana cumples (usuario, 2026-11-22): en 14 días, sábados y domingos por encima
 * del 115 % de su objetivo y los demás entre el 85 y el 115 %. Con 2 días de fin de semana y 4 de diario apuntados.
 */
export function findesDeMas(
  dias: readonly { date: string; kcal: number; objetivo: number | null }[],
  hoy: string,
): boolean {
  const en = dias.filter((d) => d.kcal > 0 && d.objetivo && d.date > addDays(hoy, -14) && d.date <= hoy)
  const ratio = (xs: typeof en) =>
    xs.reduce((s, d) => s + d.kcal, 0) / xs.reduce((s, d) => s + (d.objetivo ?? 0), 0)
  const finde = en.filter((d) => esFinde(d.date))
  const diario = en.filter((d) => !esFinde(d.date))
  if (finde.length < 2 || diario.length < 4) return false
  const r = ratio(diario)
  return ratio(finde) > 1.15 && r >= 0.85 && r <= 1.15
}

/** Tu proteína de media en g por kilo, en 7 días con al menos 4 apuntados; null si faltan. */
export function proteinaPorKilo(
  dias: readonly { date: string; kcal: number; protein: number }[],
  hoy: string,
  pesoKg: number,
): number | null {
  const en = dias.filter((d) => d.kcal > 0 && d.date > addDays(hoy, -7) && d.date <= hoy)
  if (en.length < 4 || !pesoKg) return null
  return Math.round((en.reduce((s, d) => s + d.protein, 0) / en.length / pesoKg) * 10) / 10
}

/** Qué parte de lo que gastas comes de media (14 días apuntados); null sin datos. */
export function parteDelGasto(
  dias: readonly { date: string; kcal: number }[],
  hoy: string,
  gasto: number,
): number | null {
  const en = dias.filter((d) => d.kcal > 0 && d.date > addDays(hoy, -14) && d.date <= hoy)
  if (!en.length || !gasto) return null
  return Math.round((en.reduce((s, d) => s + d.kcal, 0) / en.length / gasto) * 100) / 100
}

/** Tu grasa: si estás en la fase final (a 3 puntos de tu objetivo) o ya has llegado. */
export function grasaFinal(g: { actual: number; objetivo: number | null } | null | undefined): {
  final: boolean
  llegaste: boolean
} {
  if (!g?.objetivo) return { final: false, llegaste: false }
  return { final: g.actual - g.objetivo <= PUNTOS_FINAL, llegaste: g.actual <= g.objetivo }
}

/**
 * Los consejos de la semana que acompañan a la revisión (no cambian nada; textos «Se recomienda…»). En definición: si la
 * grasa no baja (la guía, § 7); con señales, lo que dice la regla 8; con digestiones pesadas, la guía; con la proteína baja
 * (§ 5); en la fase final con la fuerza bajando, hidratos alrededor del entreno y una recarga (decisión 2026-11-08); y tus
 * brazos y muslos, para saber si conservas músculo.
 */
export function consejosDeLaSemana(d: {
  fase: Fase
  /** Bajas más despacio de lo previsto. */
  lento: boolean
  hoy?: string
  /** Cambio de tu fuerza en los básicos (−0,02 = un 2 % menos). */
  fuerza?: number | null
  final?: boolean
  animo?: readonly Animo[]
  medidas?: readonly Perimetros[]
  /** Tu proteína de media, en g por kilo (null sin datos). */
  proteina?: number | null
  /** En volumen, la revisión propone subir kcal (o te pararía por la fuerza): antes, el reparto de los hidratos. */
  subirKcal?: boolean
  /** Llevas «Hidratos según el día» (ON/OFF). */
  onOff?: boolean
  /** Vuelves de un parón (en mantenimiento, con sus mesetas). */
  paron?: boolean
}): string[] {
  const out: string[] = []
  const senales = d.animo && d.hoy ? senalesDeLaSemana(d.animo, d.hoy) : []
  if (d.proteina != null && d.proteina < PROTEINA_MINIMA)
    out.push(
      `Proteína baja: ${d.proteina.toLocaleString('es-ES')} g de proteína por kilo. Se recomienda ${PROTEINA_MINIMA.toLocaleString('es-ES')} como mínimo.`,
    )
  if (senales.length)
    out.push(
      `Recuperación: ${senales.map((x) => NOMBRE_SENAL[x]).join(' y ')}. Se recomienda priorizar el sueño y los hidratos antes de entrenar.`,
    )
  const digestiones =
    d.animo && d.hoy ? d.animo.filter((x) => x.date > addDays(d.hoy ?? '', -7) && x.digestiones === 2) : []
  if (digestiones.length >= 3)
    out.push('Digestiones pesadas. Se recomienda simplificar las fuentes de hidratos.')
  // Volumen: antes de subir kcal, los hidratos alrededor del entreno y más los días de entreno (guía § 6 y § 13)
  if (d.fase === 'volumen' && d.subirKcal)
    out.push(
      d.onOff
        ? 'Antes de subir kcal: los hidratos, alrededor del entreno.'
        : 'Antes de subir kcal: los hidratos alrededor del entreno y más los días de entreno («Hidratos según el día»).',
    )
  // Vuelta de un parón (guía § 10, paso 6): más actividad y más comida mejor que menos de ambas
  if (d.paron)
    out.push('Vuelves de un parón: se recomienda actividad moderada-alta, más los días de descanso.')
  if (d.fase !== 'definicion') return out
  if (d.lento) out.push('Si la grasa no baja: hidratos más simples, menos fibra y menos estrés.')
  if (d.final && d.fuerza != null && d.fuerza <= FUERZA_BAJA_FINAL)
    out.push('Fuerza a la baja. Se recomiendan los hidratos alrededor del entreno.')
  if (d.medidas && d.hoy) {
    const brazo = cambioDePerimetro(d.medidas, 'brazo', d.hoy)
    const muslo = cambioDePerimetro(d.medidas, 'muslo', d.hoy)
    const conservas = [brazo, muslo].filter((x) => x !== null)
    if (conservas.length && conservas.every((x) => (x ?? 0) >= -0.5))
      out.push('Brazos y muslos estables: conservas el músculo.')
    else if (conservas.some((x) => (x ?? 0) < -1))
      out.push('Brazos o muslos a la baja. Se recomienda no acelerar el ritmo.')
  }
  return out
}

/**
 * Lo que falla en tu comida, en una frase con su cifra, para el entrenador de Entreno (usuario, 2026-11-23: que en vez de
 * «revisa la comida» diga qué). En este orden: proteína baja (§ 5), bajas demasiado rápido en definición (§ 5, 1,2 %) y
 * déficit al máximo (75 % de lo que gastas). null si nada.
 */
export function comidaParaEntreno(d: {
  fase: Fase
  proteina: number | null
  /** Tu ritmo de peso, en % por semana (null sin datos). */
  pct: number | null
  /** Qué parte de lo que gastas comes (null sin datos). */
  parte: number | null
}): string | null {
  const es = (n: number) => n.toLocaleString('es-ES')
  if (d.proteina !== null && d.proteina < PROTEINA_MINIMA)
    return `Proteína baja: ${es(d.proteina)} g por kilo. Se recomienda ${es(PROTEINA_MINIMA)} como mínimo.`
  if (d.fase !== 'definicion') return null
  if (d.pct !== null && d.pct < -RAPIDO_PCT)
    return `Bajas un ${es(Math.round(Math.abs(d.pct) * 10) / 10)} % por semana: demasiado rápido para rendir.`
  if (d.parte !== null && d.parte < DEFICIT_MAXIMO)
    return `Comes el ${Math.round(d.parte * 100)} % de lo que gastas: el déficit ya está al máximo.`
  return null
}
