// La revisión semanal del entrenador: mira 14 días y, si hace falta, propone un cambio. Nunca lo aplica: lo decides tú.
// Reglas de docs/conocimiento/02-reglas.md · sección 8 («Ajuste semanal propuesto (±150 kcal)»).
import { daysBetween, formatInt } from '../../../shared/lib/format.ts'
import { PASOS_OBJETIVO, type Fase } from './targets.ts'
import { deLosUltimos, ritmoSemanal, type PuntoPeso } from './weight.ts'

export const PESAJES_MINIMOS = 10 // en 14 días
export const DIAS_COMIDA_MINIMOS = 12 // en 4 semanas
export const DIAS_ENTRE_CAMBIOS = 10
export const CAMBIO_KCAL = 150
export const CUMPLIR = { min: 0.85, max: 1.15 } as const

/** Ritmo previsto de cada fase, en % del peso por semana, con su margen. */
export function ritmoPrevisto(fase: Fase, ritmo: number): { centro: number; min: number; max: number } {
  // Volumen: 0,375 % al mes; definición: margen ±0,2; el resto, ±0,15
  const centro = fase === 'definicion' ? -ritmo : fase === 'volumen' ? (0.375 * 7) / 30 : 0
  const margen = fase === 'definicion' ? 0.2 : 0.15
  const r = (n: number) => Math.round(n * 100) / 100
  return { centro: r(centro), min: r(centro - margen), max: r(centro + margen) }
}

export type Comprobacion = { texto: string; detalle: string }

export type Revision =
  /** Faltan datos: no se propone nada. */
  | { tipo: 'faltan'; pesajes: number; faltanPesajes: number; dias: number; faltanDias: number }
  /** Comes fuera del 85–115 % del objetivo: primero, cumplir. */
  | { tipo: 'cumplir'; cumplido: number }
  /** Vas al ritmo previsto. */
  | { tipo: 'bien'; pct: number; kgSemana: number; previsto: { min: number; max: number } }
  /** Haría falta un cambio, pero el último fue hace menos de 10 días. */
  | { tipo: 'esperar'; dias: number }
  /** En definición y lento: antes de comer menos, llegar a 10.000 pasos. */
  | { tipo: 'pasos'; pct: number; kgSemana: number; previsto: { min: number; max: number }; pasos: number }
  /** Ya estás en el mínimo: no se baja más. */
  | { tipo: 'suelo'; pct: number; suelo: number }
  /** La sugerencia: de `de` a `a` kcal. */
  | {
      tipo: 'cambio'
      de: number
      a: number
      lento: boolean
      pct: number
      kgSemana: number
      previsto: { min: number; max: number }
      comprobaciones: Comprobacion[]
    }

export type DatosRevision = {
  hoy: string
  fase: Fase
  ritmo: number
  kcal: number
  suelo: number
  /** Tus pasos al día (de tus datos). */
  pasos: number
  serie: readonly PuntoPeso[]
  /** Lo comido cada día (solo los días con algo apuntado cuentan). */
  dias: readonly { date: string; kcal: number }[]
  /** Fecha del último cambio de tu objetivo. */
  ultimoCambio: string | null
}

export function revisar(d: DatosRevision): Revision {
  const pesajes = deLosUltimos(d.serie, d.hoy, 14).length
  const dias = deLosUltimos(d.dias, d.hoy, 28).filter((x) => x.kcal > 0).length
  const ritmo = ritmoSemanal(d.serie, d.hoy)
  if (pesajes < PESAJES_MINIMOS || dias < DIAS_COMIDA_MINIMOS || !ritmo) {
    return {
      tipo: 'faltan',
      pesajes,
      faltanPesajes: Math.max(0, PESAJES_MINIMOS - pesajes),
      dias,
      faltanDias: Math.max(0, DIAS_COMIDA_MINIMOS - dias),
    }
  }
  const comidos = deLosUltimos(d.dias, d.hoy, 14).filter((x) => x.kcal > 0)
  const cumplido = comidos.length ? comidos.reduce((s, x) => s + x.kcal, 0) / comidos.length / d.kcal : 0
  if (cumplido < CUMPLIR.min || cumplido > CUMPLIR.max)
    return { tipo: 'cumplir', cumplido: redondear(cumplido) }

  const previsto = ritmoPrevisto(d.fase, d.ritmo)
  const { pctSemana: pct, kgSemana } = ritmo
  if (pct >= previsto.min && pct <= previsto.max) return { tipo: 'bien', pct, kgSemana, previsto }

  // Por encima del previsto: pierdes menos (o ganas más) de lo que toca → comer menos
  const bajar = pct > previsto.max
  const lento = d.fase === 'definicion' ? bajar : d.fase === 'volumen' ? !bajar : false
  const desde = d.ultimoCambio ? daysBetween(d.ultimoCambio, d.hoy) : Infinity
  if (desde < DIAS_ENTRE_CAMBIOS) return { tipo: 'esperar', dias: DIAS_ENTRE_CAMBIOS - desde }
  if (d.fase === 'definicion' && bajar && d.pasos < PASOS_OBJETIVO)
    return { tipo: 'pasos', pct, kgSemana, previsto, pasos: d.pasos }

  const a = bajar ? Math.max(d.suelo, d.kcal - CAMBIO_KCAL) : d.kcal + CAMBIO_KCAL
  if (a >= d.kcal && bajar) return { tipo: 'suelo', pct, suelo: d.suelo }
  return {
    tipo: 'cambio',
    de: d.kcal,
    a,
    lento,
    pct,
    kgSemana,
    previsto,
    comprobaciones: [
      { texto: `${pesajes} pesajes en 14 días`, detalle: `mín. ${PESAJES_MINIMOS}` },
      { texto: `Comiste el ${Math.round(cumplido * 100)} % de tu objetivo`, detalle: '85–115 %' },
      ...(d.fase === 'definicion' && bajar
        ? [{ texto: `${formatInt(d.pasos)} pasos al día: ya andas lo suficiente`, detalle: '10.000' }]
        : []),
      {
        texto: Number.isFinite(desde) ? `${desde} días sin cambios` : 'Primer cambio',
        detalle: `mín. ${DIAS_ENTRE_CAMBIOS}`,
      },
    ],
  }
}

const redondear = (n: number) => Math.round(n * 100) / 100

/** El título de la sugerencia, en palabras. */
export function tituloCambio(r: { lento: boolean; de: number; a: number }, fase: Fase): string {
  if (fase === 'definicion')
    return r.lento ? 'Bajas más despacio de lo previsto' : 'Bajas más deprisa de lo previsto'
  if (fase === 'volumen')
    return r.lento ? 'Subes más despacio de lo previsto' : 'Subes más deprisa de lo previsto'
  return r.a < r.de ? 'Estás subiendo de peso' : 'Estás bajando de peso'
}
