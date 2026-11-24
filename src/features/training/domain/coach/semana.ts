// Tu entrenador de Entreno, la semana entera (usuario, 2026-11-23: «igual de potente que el nutricionista», «que hagan
// equipo»; propuesta MUTA-Entrenador-propuesta.png). Antes de mirar músculo a músculo (revision.ts), decide qué manda esta
// semana, en este orden y una cosa cada vez:
// 1. Vuelves de un parón → menos volumen (guía § 10: el de antes ya no sirve).
// 2. Constancia y RIR apuntado → sin ellos no se lee la semana (guía § 5, paso 1: esfuerzo estandarizado).
// 3. Lejos del fallo (RIR 2 o más por encima de la pauta) → primero, acércate (02-reglas § 5, revisión de ciclo).
// 4. Recarga de hidratos (de Nutrición) → el rendimiento de esos días no cuenta.
// 5. Fin de la definición y fuerza bajando → la recarga, no quitar series (guía § 7).
// 6. Cómo estás (las mismas señales que el nutricionista) → esa semana no se sube (02-reglas § 5).
// Nada cambia solo: cada propuesta, con «Aplicar / Ahora no».
import { addDays, daysBetween } from '../../../../shared/lib/format.ts'
import type { Entreno } from '../workoutHistory.ts'

/** Días sin entrenar que cuentan como parón (sugerido: la guía no da la cifra). */
export const DIAS_PARON = 14
/** RIR apuntado por encima de la pauta a partir del cual vas lejos del fallo (02-reglas § 5). */
export const LEJOS_DEL_FALLO = 2
/** Con menos de la mitad de las series con su RIR, no se lee la semana (sugerido). */
export const RIR_MINIMO = 0.5
/** Cada cuántas vueltas de tu rutina se comprueba tu RIR con una serie al fallo técnico (02-reglas § 5). */
export const VUELTAS_CALIBRAR = 4

/** Lo que da Nutrición (por su index.ts) al entrenador; null sin objetivo de comida. */
export type DeNutricion = {
  fase: 'definicion' | 'mantenimiento' | 'volumen'
  /** Semana 9 o más de la definición, o cerca de tu grasa objetivo. */
  finDefinicion: boolean
  /** Recarga en curso o recién terminada: hasta cuándo no se lee tu rendimiento. */
  pausaHasta: string | null
  /** El nutricionista propone hoy una recarga. */
  recargaPropuesta: boolean
  /** Cuándo cambiaron tus kcal por última vez (una sugerencia aplicada); null si no. */
  cambioKcal: string | null
  /** Lo que falla en tu comida, en una frase con su cifra (proteína, ritmo o déficit); null si nada. */
  comida: string | null
  /** Tu fuerza en los básicos baja (−3 % o más), como la lee el nutricionista. */
  fuerzaBaja: boolean
  /** Cómo estás esta semana («duermes poco»…), las señales que lee también el nutricionista. */
  recuperacion: string[]
}

export type Foco = 'paron' | 'datos' | 'fallo' | 'recarga' | 'finDefi' | 'recuperacion' | 'normal'

export type FilaSemana = { etiqueta: string; valor: string; bien?: boolean }

export type EstadoSemana = {
  foco: Foco
  /** Si manda algo de la semana: su estado, titular, cifras y nota (en `normal`, lo pone la revisión por músculo). */
  estado: string
  titulo: string
  filas: FilaSemana[]
  nota: string | null
  /** Esta semana no se propone subir series. */
  sinSubir: boolean
  /** Esta semana no se propone quitar series (se espera: recarga, comida recién cambiada, lejos del fallo). */
  sinQuitar: boolean
}

/** El último parón si acabó en las dos últimas semanas (vuelves de él): sus días y el día que volviste; null si no. */
export function diasDeParon(
  entrenos: readonly Pick<Entreno, 'fecha'>[],
  hoy: string,
): { dias: number; vuelta: string } | null {
  const fechas = [...new Set(entrenos.map((e) => e.fecha))].filter((f) => f <= hoy).sort()
  for (let i = fechas.length - 1; i > 0; i--) {
    const f = fechas[i] ?? ''
    if (f < addDays(hoy, -DIAS_PARON)) break
    const hueco = daysBetween(fechas[i - 1] ?? f, f)
    if (hueco >= DIAS_PARON) return { dias: hueco, vuelta: f }
  }
  return null
}

/** Ejercicios de la semana con todas sus series a RIR 2 o más por encima de la pauta (vas lejos del fallo). */
export function lejosDelFallo(
  entrenos: readonly Entreno[],
  desde: string,
  hasta: string,
  rirDe: (nombre: string) => number | undefined,
): { nombre: string; rir: number; pauta: number }[] {
  const vistos = new Map<string, { nombre: string; rir: number; pauta: number }>()
  for (const x of entrenos) {
    if (x.fecha < desde || x.fecha > hasta) continue
    for (const e of x.ejercicios) {
      const pauta = rirDe(e.nombre)
      const rirs = e.series.map((s) => s.rir).filter((r): r is number => r !== undefined)
      if (pauta === undefined || !rirs.length || rirs.length < e.series.length) continue
      const rir = Math.min(...rirs)
      if (rir - pauta >= LEJOS_DEL_FALLO) vistos.set(e.nombre, { nombre: e.nombre, rir, pauta })
    }
  }
  return [...vistos.values()]
}

/** RIR de media por debajo de la pauta desde el que vas demasiado cerca del fallo (02-reglas § 5: «cansado», 1,5). */
export const CERCA_DEL_FALLO = 1.5

/**
 * Ejercicios de la semana con su RIR de media 1,5 o más por debajo de la pauta: vas más al fallo de lo que toca. La guía
 * (§ 3): dosificar el RIR saca más tonelaje; ir al fallo desde la primera serie, menos.
 */
export function cercaDelFallo(
  entrenos: readonly Entreno[],
  desde: string,
  hasta: string,
  rirDe: (nombre: string) => number | undefined,
): string[] {
  const vistos = new Set<string>()
  for (const x of entrenos) {
    if (x.fecha < desde || x.fecha > hasta) continue
    for (const e of x.ejercicios) {
      const pauta = rirDe(e.nombre)
      const rirs = e.series.map((s) => s.rir).filter((r): r is number => r !== undefined)
      if (pauta === undefined || !rirs.length) continue
      const media = rirs.reduce((a, b) => a + b, 0) / rirs.length
      if (pauta - media >= CERCA_DEL_FALLO) vistos.add(e.nombre)
    }
  }
  return [...vistos]
}

/** Series de la semana y cuántas llevan su RIR apuntado. */
export function seriesConRir(entrenos: readonly Entreno[], desde: string, hasta: string) {
  let total = 0
  let con = 0
  for (const x of entrenos) {
    if (x.fecha < desde || x.fecha > hasta) continue
    for (const e of x.ejercicios)
      for (const s of e.series) {
        total++
        if (s.rir !== undefined) con++
      }
  }
  return { total, con }
}

/** Toca comprobar tu RIR: al empezar cada 4.ª vuelta de tu rutina (la primera sesión de esa vuelta y las de su semana). */
export function tocaCalibrar(sesionesHechas: number, porVuelta: number): boolean {
  if (porVuelta < 1 || sesionesHechas < porVuelta) return false
  const vueltas = Math.floor(sesionesHechas / porVuelta)
  return vueltas % VUELTAS_CALIBRAR === 0 && sesionesHechas % porVuelta < porVuelta
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

const NADA = { nota: null, sinSubir: false, sinQuitar: false }

/** Qué manda esta semana, antes de mirar músculo a músculo. */
export function estadoDeLaSemana(d: {
  hoy: string
  sesiones: number
  objetivo: number
  rir: { total: number; con: number }
  lejos: readonly { nombre: string; rir: number; pauta: number }[]
  paron: { dias: number; vuelta: string } | null
  nutricion: DeNutricion | null
}): EstadoSemana {
  const n = d.nutricion
  const sesiones: FilaSemana = { etiqueta: 'Sesiones hechas', valor: `${d.sesiones} de ${d.objetivo}` }
  if (d.paron !== null)
    return {
      foco: 'paron',
      estado: '1 sugerencia',
      titulo: 'Vuelve con menos volumen',
      filas: [{ etiqueta: 'Días sin entrenar', valor: String(d.paron.dias) }],
      nota: 'Tus rangos han bajado: se recomienda una serie menos por músculo y subir poco a poco, sin priorizar aún.',
      sinSubir: true,
      sinQuitar: false,
    }
  const conRir = d.rir.total ? d.rir.con / d.rir.total : 0
  // Sin el RIR apuntado no se sabe tu esfuerzo: no se lee la semana. Las sesiones que faltan se dicen (en las cifras y en
  // «Esta semana»), pero no paran lo demás: quien entrena menos días también progresa
  if (conRir < RIR_MINIMO)
    return {
      foco: 'datos',
      estado: 'Faltan datos',
      titulo: 'Aún no se puede leer tu semana',
      filas: [sesiones, { etiqueta: 'Series con RIR', valor: `${d.rir.con} de ${d.rir.total}` }],
      nota: 'Se recomienda apuntar el RIR de cada serie.',
      sinSubir: true,
      sinQuitar: true,
    }
  if (d.lejos.length)
    return {
      foco: 'fallo',
      estado: 'Primero',
      titulo: 'Acércate a tu RIR',
      filas: d.lejos
        .slice(0, 3)
        .map((x) => ({ etiqueta: x.nombre, valor: `RIR ${x.rir} · pauta ${x.pauta}` })),
      nota: 'Antes de cambiar series, apura más cada serie.',
      sinSubir: true,
      sinQuitar: true,
    }
  if (n?.pausaHasta && d.hoy <= n.pausaHasta)
    return {
      foco: 'recarga',
      estado: 'En pausa',
      titulo: 'Recarga de hidratos',
      filas: [sesiones],
      nota: 'Tu rendimiento de estos días no cuenta: se vuelve a leer después.',
      sinSubir: true,
      sinQuitar: true,
    }
  if (n?.finDefinicion && n.fuerzaBaja)
    return {
      foco: 'finDefi',
      estado: 'Recomendación',
      titulo: 'Tu fuerza baja: toca recargar',
      filas: [sesiones],
      nota: 'No se quitan series: se recomienda una recarga de hidratos.',
      sinSubir: true,
      sinQuitar: true,
    }
  if (n?.recuperacion.length)
    return {
      foco: 'recuperacion',
      estado: 'Sin cambios',
      titulo: 'Esta semana no se sube nada',
      filas: [{ etiqueta: 'Recuperación', valor: mayuscula(n.recuperacion.join(', ')) }, sesiones],
      nota: 'Se recomienda recuperar antes de subir series.',
      sinSubir: true,
      sinQuitar: false,
    }
  // Tu comida acaba de cambiar: una bajada de fuerza esta semana puede ser de eso; se espera antes de quitar series
  const kcalRecien = n?.cambioKcal ? daysBetween(n.cambioKcal, d.hoy) < 7 : false
  return {
    foco: 'normal',
    estado: 'Sin cambios',
    titulo: '',
    filas: [sesiones, { etiqueta: 'Recuperación', valor: 'Buena' }],
    ...NADA,
    sinQuitar: kcalRecien,
  }
}
