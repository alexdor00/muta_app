// La revisión semanal del entrenador: mira 14 días y, si hace falta, propone un cambio. Nunca lo aplica: lo decides tú.
// Reglas de docs/conocimiento/02-reglas.md · sección 8 («Ajuste semanal propuesto (±150 kcal)»). En volumen, antes de subir
// kcal se mira si progresas (decisión 2026-11-08, guía G1 §6, 04-guia-culturismo-natural.md).
import { addDays, daysBetween, formatInt } from '../../../shared/lib/format.ts'
import {
  BAJADA_FINAL,
  deficitDiario,
  SEMANA_FINAL,
  MESETAS_PARON,
  PASOS_OBJETIVO,
  ritmoDeLaSemana,
  SUBIDA_MESETA,
  type Fase,
  type Situacion,
} from './targets.ts'
import {
  cambioDePerimetro,
  CINTURA_BAJA,
  DEFICIT_MAXIMO,
  findesDeMas,
  FUERZA_BAJA,
  grasaFinal,
  parteDelGasto,
  RAPIDO_PCT,
  semanasConSenales,
  SEMANAS_ATRAGANTADA,
  senalesDeLaSemana,
  SENALES_PARA_FRENAR,
  type Animo,
  type Perimetros,
  type Senal,
} from './senales.ts'
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
  /** En una recarga de hidratos o la semana de después: el peso sube por el agua, no se propone nada. */
  | { tipo: 'recarga'; vuelve: string }
  /** Fuera del margen solo esta semana (regla 7): se espera a la siguiente. */
  | { tipo: 'unaSemana'; pct: number }
  /** Bajas lento, pero tu cintura baja (regla 5): no se toca nada. */
  | { tipo: 'cintura'; pct: number; cm: number }
  /** Bajas lento, pero estás mal (sueño, energía, hambre, estrés): no se aprieta esta semana. */
  | { tipo: 'senales'; pct: number; senales: Senal[] }
  /** Te pasas los fines de semana: no se baja, se reparte mejor. */
  | { tipo: 'findes'; pct: number }
  /** Ya comes menos del 75 % de lo que gastas: no se baja más. */
  | { tipo: 'deficit'; pct: number; parte: number }
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
      extra?: { ritmoTramo?: number; meseta?: true; fase?: Fase; situacion?: Situacion }
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
  /** La recarga de hidratos (la última o la que llevas). */
  recarga?: { desde: string; hasta: string } | null
  /** Las señales del entrenador (usuario, 2026-11-22): cómo estás, tus perímetros, tu comida con su objetivo y su
   * proteína, lo que gastas, tu grasa con su objetivo y tus kcal de mantenimiento (para una pausa). */
  animo?: readonly Animo[]
  medidas?: readonly Perimetros[]
  comida?: readonly { date: string; kcal: number; protein: number; objetivo: number | null }[]
  gasto?: number | null
  grasa?: { actual: number; objetivo: number | null } | null
  mantenimiento?: number
  /** De Entreno (usuario, 2026-11-23: que trabajen en equipo): vuelves de un parón y cuándo te subió series por última vez. */
  paron?: boolean
  cambioEntreno?: string | null
}

/**
 * Los días tras una recarga en los que el peso aún lleva el agua de los hidratos (usuario, 2026-11-22: dos semanas, para que
 * la media del peso no la arrastre; sugerido, los documentos no dicen cuánto dura). Ni la revisión ni lo que gastas se miran
 * con ellos; después, la definición sigue como antes.
 */
export const DIAS_TRAS_RECARGA = 14

/** Si hoy pesa la recarga (la llevas o acabó hace menos de una semana): hasta cuándo. null si no. */
export function trasRecarga(
  r: { desde: string; hasta: string } | null | undefined,
  hoy: string,
): string | null {
  if (!r || hoy < r.desde) return null
  const vuelve = addDays(r.hasta, DIAS_TRAS_RECARGA + 1)
  return hoy < vuelve ? vuelve : null
}

export function revisar(d: DatosRevision): Revision {
  const vuelve = trasRecarga(d.recarga, d.hoy)
  if (vuelve) return { tipo: 'recarga', vuelve }
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

  // Vuelves de un parón (lo ve Entreno: 14 días o más sin entrenar, sugerido): media normocalórica y dos mesetas antes de
  // definir o seguir subiendo (guía § 10). El entrenador, a la vez, propone menos volumen.
  if (d.paron && !(d.fase === 'mantenimiento' && d.situacion === 'paron') && d.mantenimiento)
    return {
      tipo: 'cambio',
      de: d.kcal,
      a: d.mantenimiento,
      lento: d.mantenimiento > d.kcal,
      pct,
      kgSemana,
      previsto,
      comprobaciones: comprobacionesBase,
      motivo: 'Vuelves de un parón: mantenimiento y subir en dos mesetas',
      extra: { fase: 'mantenimiento', situacion: 'paron' },
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
  const defi = d.fase === 'definicion'
  // Etapa final de la definición: la semana 9 o a 3 puntos de tu grasa objetivo (regla 6), la que llegue antes
  const grasa = grasaFinal(d.grasa)
  const final = defi && ((d.semanaFase ?? 0) >= SEMANA_FINAL || grasa.final)
  const cambio = (
    a: number,
    lento: boolean,
    motivo?: string,
    extra?: Extract<Revision, { tipo: 'cambio' }>['extra'],
  ) =>
    ({
      tipo: 'cambio',
      de: d.kcal,
      a,
      lento,
      pct,
      kgSemana,
      previsto,
      comprobaciones: comprobacionesBase,
      motivo,
      extra,
    }) as const

  // En definición, por delante: has llegado a tu grasa objetivo (salir, con su subida poco a poco) o la definición se
  // atraganta (3 semanas con señales y bajando lento: una pausa en mantenimiento). Ver la guía, § 7 y § 9.
  const lentoDefi = defi && pct > previsto.max
  if (defi && desde >= DIAS_ENTRE_CAMBIOS) {
    if (grasa.llegaste)
      return cambio(d.kcal, false, 'Has llegado a tu objetivo de grasa: toca salir de la definición', {
        fase: 'mantenimiento',
        situacion: 'salida',
      })
    if (lentoDefi && d.animo && semanasConSenales(d.animo, d.hoy) >= SEMANAS_ATRAGANTADA)
      return cambio(
        Math.max(d.kcal, d.mantenimiento ?? d.kcal),
        false,
        'La definición se atraganta: se recomienda una pausa en mantenimiento',
        { fase: 'mantenimiento' },
      )
  }

  // Tu fuerza baja en los básicos (regla 4, fuera de la fase final): +150 kcal en hidratos alrededor del entreno
  if (defi && !final && d.fuerza != null && d.fuerza <= FUERZA_BAJA && desde >= DIAS_ENTRE_CAMBIOS)
    return cambio(
      d.kcal + CAMBIO_KCAL,
      false,
      `Tu fuerza baja en tus básicos (${Math.round(d.fuerza * 100)} %): +${CAMBIO_KCAL} kcal en hidratos alrededor del entreno`,
    )

  // En definición, demasiado rápido es más del 1,2 % por semana (§ 5); entre tu margen y eso, vas bien
  const rapido = defi ? pct < -RAPIDO_PCT : pct < previsto.min
  const fuera = defi ? lentoDefi || rapido : pct < previsto.min || pct > previsto.max
  if (!fuera) return { tipo: 'bien', pct, kgSemana, previsto }

  // Una sola semana fuera → esperar (regla 7): la semana anterior también tiene que salir del mismo lado
  const antes = ritmoSemanal(d.serie, addDays(d.hoy, -7))
  const mismoLado = (x: number) =>
    pct > previsto.max ? x > previsto.max : defi ? x < -RAPIDO_PCT : x < previsto.min
  if (antes && !mismoLado(antes.pctSemana)) return { tipo: 'unaSemana', pct }

  // Por encima del previsto: pierdes menos (o ganas más) de lo que toca → comer menos
  const bajar = pct > previsto.max
  const lento = defi ? bajar : d.fase === 'volumen' ? !bajar : false
  if (desde < DIAS_ENTRE_CAMBIOS) return { tipo: 'esperar', dias: DIAS_ENTRE_CAMBIOS - desde }
  // Un cambio cada vez entre los dos: si el entrenador acaba de subirte series, antes de subir kcal se ve su efecto
  const entreno = d.cambioEntreno ? daysBetween(d.cambioEntreno, d.hoy) : Infinity
  if (d.fase === 'volumen' && lento && entreno < DIAS_ENTRE_CAMBIOS)
    return { tipo: 'esperar', dias: DIAS_ENTRE_CAMBIOS - entreno }
  // Peso parado en volumen: si progresas en tus básicos, no se suben las kcal (antes, descanso, perímetros…)
  if (d.fase === 'volumen' && lento && d.fuerza != null && d.fuerza >= 0)
    return { tipo: 'progresas', pct, fuerza: d.fuerza }

  // Bajas lento en definición: antes de comer menos, lo que miraría un entrenador
  if (defi && bajar) {
    if (d.comida && findesDeMas(d.comida, d.hoy)) return { tipo: 'findes', pct }
    const cintura = d.medidas ? cambioDePerimetro(d.medidas, 'cintura', d.hoy) : null
    if (cintura !== null && cintura <= CINTURA_BAJA) return { tipo: 'cintura', pct, cm: cintura }
    const senales = d.animo ? senalesDeLaSemana(d.animo, d.hoy) : []
    if (senales.length >= SENALES_PARA_FRENAR) return { tipo: 'senales', pct, senales }
    if (d.pasos < PASOS_OBJETIVO) return { tipo: 'pasos', pct, kgSemana, previsto, pasos: d.pasos }
    const parte = d.comida && d.gasto ? parteDelGasto(d.comida, d.hoy, d.gasto) : null
    if (parte !== null && parte < DEFICIT_MAXIMO) return { tipo: 'deficit', pct, parte }
  }

  // Etapa final de la definición: no se aprieta tanto (−100 en vez de −150)
  const a = bajar ? Math.max(d.suelo, d.kcal - (final ? BAJADA_FINAL : CAMBIO_KCAL)) : d.kcal + CAMBIO_KCAL
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
