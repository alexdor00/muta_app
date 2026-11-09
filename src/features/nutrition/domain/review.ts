// La revisión semanal del entrenador: mira 14 días y, si hace falta, propone un cambio. Nunca lo aplica: lo decides tú.
// Reglas de docs/conocimiento/02-reglas.md · sección 8 («Ajuste semanal propuesto (±150 kcal)»). En volumen, antes de subir
// kcal se mira si progresas (decisión 2026-11-08, guía G1 §6, 04-guia-culturismo-natural.md).
import { daysBetween, formatInt } from '../../../shared/lib/format.ts'
import {
  deficitDiario,
  MESETAS_PARON,
  PASOS_OBJETIVO,
  ritmoDeLaSemana,
  SUBIDA_MESETA,
  type Fase,
  type Situacion,
} from './targets.ts'
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
  /** En volumen subes despacio, pero tu fuerza en los básicos no baja: no se tocan las kcal. */
  | { tipo: 'progresas'; pct: number; fuerza: number }
  /** Vuelves de un parón o sales de una definición: esperando a que tu peso se estabilice para subir. */
  | { tipo: 'meseta'; pct: number; hechas: number }
  /** Tras un parón, las dos mesetas hechas: ya puedes definir (o seguir subiendo). */
  | { tipo: 'mesetasHechas'; hechas: number }
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
      /** Por qué, si no es por el ritmo (nueva etapa de la definición, una meseta). */
      motivo?: string
      /** Lo que cambia en tus ajustes al aplicarla, además de las kcal. */
      extra?: { ritmoTramo?: number; meseta?: true }
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
  /** Cambio de tu fuerza en los básicos (0,02 = un 2 % más); null o sin poner si no hay datos. */
  fuerza?: number | null
  /** Tu peso (para el déficit de cada etapa) y la semana de tu fase (1 = la primera). */
  pesoKg?: number
  semanaFase?: number
  /** Velocidad por fases en definición, y la velocidad con la que están calculadas tus kcal ahora. */
  porFases?: boolean
  ritmoAplicado?: number
  /** Vuelves de un parón o sales de una definición (en mantenimiento), y las mesetas que llevas. */
  situacion?: Situacion | null
  mesetas?: number
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

  const aplicado = d.ritmoAplicado ?? d.ritmo
  const previsto = ritmoPrevisto(d.fase, aplicado)
  const { pctSemana: pct, kgSemana } = ritmo
  const desde = d.ultimoCambio ? daysBetween(d.ultimoCambio, d.hoy) : Infinity
  const comprobacionesBase = [
    { texto: `${pesajes} pesajes en 14 días`, detalle: `mín. ${PESAJES_MINIMOS}` },
    { texto: `Comiste el ${Math.round(cumplido * 100)} % de tu objetivo`, detalle: '85–115 %' },
  ]

  // Velocidad por fases: al llegar a la siguiente etapa de la definición, se propone su objetivo
  if (d.fase === 'definicion' && d.porFases && d.semanaFase && d.pesoKg) {
    const toca = ritmoDeLaSemana(d.ritmo, d.semanaFase)
    if (toca !== aplicado)
      return {
        tipo: 'cambio',
        de: d.kcal,
        a: Math.max(d.suelo, d.kcal + deficitDiario(d.pesoKg, aplicado) - deficitDiario(d.pesoKg, toca)),
        lento: toca < aplicado,
        pct,
        kgSemana,
        previsto,
        comprobaciones: comprobacionesBase,
        motivo: `Nueva etapa de la definición: −${toca.toLocaleString('es-ES')} % por semana`,
        extra: { ritmoTramo: toca },
      }
  }

  // Vuelta de un parón o salida de una definición: +200 kcal en hidratos cada vez que el peso se estabiliza
  if (d.fase === 'mantenimiento' && d.situacion) {
    const hechas = d.mesetas ?? 0
    if (d.situacion === 'paron' && hechas >= MESETAS_PARON) return { tipo: 'mesetasHechas', hechas }
    if (Math.abs(pct) > 0.15) return { tipo: 'meseta', pct, hechas }
    if (desde < DIAS_ENTRE_CAMBIOS) return { tipo: 'esperar', dias: DIAS_ENTRE_CAMBIOS - desde }
    return {
      tipo: 'cambio',
      de: d.kcal,
      a: d.kcal + SUBIDA_MESETA,
      lento: true,
      pct,
      kgSemana,
      previsto,
      comprobaciones: comprobacionesBase,
      motivo: `Meseta ${hechas + 1}: tu peso se ha estabilizado, +${SUBIDA_MESETA} kcal en hidratos`,
      extra: { meseta: true },
    }
  }
  if (pct >= previsto.min && pct <= previsto.max) return { tipo: 'bien', pct, kgSemana, previsto }

  // Por encima del previsto: pierdes menos (o ganas más) de lo que toca → comer menos
  const bajar = pct > previsto.max
  const lento = d.fase === 'definicion' ? bajar : d.fase === 'volumen' ? !bajar : false
  if (desde < DIAS_ENTRE_CAMBIOS) return { tipo: 'esperar', dias: DIAS_ENTRE_CAMBIOS - desde }
  // Peso parado en volumen: si progresas en tus básicos, no se suben las kcal (antes, descanso, perímetros…)
  if (d.fase === 'volumen' && lento && d.fuerza != null && d.fuerza >= 0)
    return { tipo: 'progresas', pct, fuerza: d.fuerza }
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
export function tituloCambio(
  r: { lento: boolean; de: number; a: number; motivo?: string },
  fase: Fase,
): string {
  if (r.motivo) return r.motivo
  if (fase === 'definicion')
    return r.lento ? 'Bajas más despacio de lo previsto' : 'Bajas más deprisa de lo previsto'
  if (fase === 'volumen')
    return r.lento ? 'Subes más despacio de lo previsto' : 'Subes más deprisa de lo previsto'
  return r.a < r.de ? 'Estás subiendo de peso' : 'Estás bajando de peso'
}

/**
 * Consejos de la semana que acompañan a la revisión (no cambian nada): si la grasa no baja en definición, y en la segunda
 * mitad de una definición, la recarga de hidratos de varios días (guía G1 §7; cuántos días y cuánto, sugerido).
 */
export function consejosDeLaSemana(d: {
  fase: Fase
  /** Bajas más despacio de lo previsto. */
  lento: boolean
  semanaFase?: number
  /** Cambio de tu fuerza en los básicos (−0,02 = un 2 % menos). */
  fuerza?: number | null
}): string[] {
  if (d.fase !== 'definicion') return []
  const out: string[] = []
  if (d.lento)
    out.push(
      'Si la grasa no baja: simplifica las fuentes de hidratos, modera la fibra, quita lo que te sienta mal y revisa el estrés.',
    )
  if ((d.semanaFase ?? 0) >= 9 && (d.fuerza ?? 0) < 0)
    out.push(
      'Llevas semanas en definición y tu fuerza baja: se recomienda una recarga de hidratos de 2–3 días, comiendo lo de mantenimiento (nunca de un solo día).',
    )
  return out
}
