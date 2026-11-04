// La sesión en curso: lo que se apunta, en memoria y guardado en IndexedDB a cada cambio (use-cases/training.ts), así
// sobrevive a recargar la app. Lleva una copia de los ejercicios con los que empezó (con la vez anterior).
import { signal } from '@preact/signals'
import { formatDecimal, parseDecimal } from '../../../shared/lib/format.ts'
import { effortLabel } from '../domain/effort.ts'
import { planCalentamiento } from '../domain/warmup.ts'
import {
  kilosDeHoy,
  repsDeSerie,
  sugerenciaDe,
  textoReps,
  type EjercicioPlan,
  type SesionPlan,
} from '../domain/workoutPlan.ts'
import { compararConAntes, descansoTras, revisarNumeros, type SerieHecha } from '../domain/workoutSet.ts'
import { resumenSesion } from '../domain/workoutSummary.ts'

/** Una bajada (dropset) o mini-serie (rest-pause) dentro de una serie, tal cual se teclea. */
export type ExtraEnCurso = { kg: string; reps: string }

/**
 * Lo escrito en una serie: kilos, repeticiones y las que quedaban, tal cual se teclean («62,5»); `extra`, sus bajadas o
 * mini-series si el ejercicio lleva dropset o rest-pause.
 */
export type SerieEnCurso = {
  kg: string
  reps: string
  quedan: string
  hecha: boolean
  extra?: ExtraEnCurso[]
}

export type EjercicioEnCurso = {
  series: SerieEnCurso[]
  calentamiento: boolean[]
  /** Nota de técnica («Agujero 11, agarre neutro»). */
  nota: string
  /** Si hoy se hace otro en su lugar (solo esta sesión; el plan no cambia). */
  cambiadoPor: string | null
}

export type SesionEnCurso = {
  sigla: string
  nombre: string
  /** Los ejercicios de la sesión al empezar, con la vez anterior (el resumen compara con esto). */
  base: EjercicioPlan[]
  /** Cuándo empezó (ms), para el tiempo de arriba. */
  inicio: number
  /** Tiempo en pausa: desde cuándo (null si corre) y cuánto se ha parado ya. */
  pausadaEn: number | null
  pausaMs: number
  /** Cuándo se terminó (null mientras sigue). */
  terminada: number | null
  /** Lo apuntado de cada ejercicio: los del plan y, detrás, los añadidos hoy (en el mismo orden). */
  ejercicios: EjercicioEnCurso[]
  /** Ejercicios añadidos hoy desde la biblioteca (C19); el plan no cambia. */
  anadidos: EjercicioPlan[]
  /** El orden de hoy: posiciones en `ejercicios`, de primero a último (se cambia solo hoy: ordenHoy.ts). */
  orden: number[]
  /** «Consejos de hoy» (C10): lo marcado de «Antes de la primera serie», si ya se vio el aviso y los consejos aplicados. */
  marcados: boolean[]
  consejosVistos: boolean
  aplicados: string[]
}

type Campo = keyof Omit<SerieEnCurso, 'hecha' | 'extra'>

export const sesionEnCurso = signal<SesionEnCurso | null>(null)

/** Guarda cómo va la sesión (cada serie apuntada, cada cambio). */
export function guardarSesion(sesion: SesionEnCurso | null): void {
  sesionEnCurso.value = sesion
}

export const SERIE_VACIA: SerieEnCurso = { kg: '', reps: '', quedan: '', hecha: false }

/** Los ejercicios de hoy: los de la sesión del plan y los añadidos. */
export const ejerciciosDe = (en: SesionEnCurso): EjercicioPlan[] => [...en.base, ...en.anadidos]

/** Añade un ejercicio al final, solo para hoy: sus series vacías y, sin vez anterior, sin calentamiento. */
export function anadirEjercicio(en: SesionEnCurso, e: EjercicioPlan): SesionEnCurso {
  return {
    ...en,
    anadidos: [...en.anadidos, e],
    orden: [...en.orden, en.ejercicios.length],
    ejercicios: [
      ...en.ejercicios,
      {
        series: Array.from({ length: e.series }, () => ({ ...SERIE_VACIA })),
        calentamiento: [],
        nota: '',
        cambiadoPor: null,
      },
    ],
  }
}

/** El calentamiento de cada ejercicio, calculado con el peso de hoy de su primera serie (el que propone el motor). */
export function calentamientos(ejercicios: readonly EjercicioPlan[]) {
  return planCalentamiento(
    ejercicios.map((e) => ({
      musculo: e.musculo,
      secundarios: e.secundarios,
      compuesto: e.compuesto,
      pesoCorporal: e.pesoCorporal ?? false,
      kilos: kilosDeHoy(e),
      salto: e.salto,
    })),
  )
}

/** Al empezar: tantas series vacías como pide cada ejercicio y nada calentado. */
export function nuevaSesion(sesion: SesionPlan, inicio: number): SesionEnCurso {
  const plan = calentamientos(sesion.ejercicios)
  return {
    sigla: sesion.sigla,
    nombre: sesion.nombre,
    base: sesion.ejercicios,
    inicio,
    pausadaEn: null,
    pausaMs: 0,
    terminada: null,
    anadidos: [],
    orden: sesion.ejercicios.map((_, i) => i),
    marcados: [],
    consejosVistos: false,
    aplicados: [],
    ejercicios: sesion.ejercicios.map((e, i) => ({
      series: Array.from({ length: e.series }, () => ({ ...SERIE_VACIA })),
      calentamiento: (plan[i] ?? []).map(() => false),
      nota: e.nota ?? '',
      cambiadoPor: null,
    })),
  }
}

/** Segundos que lleva la sesión, sin contar las pausas. */
export function segundosSesion(en: SesionEnCurso, ahora: number): number {
  const fin = en.terminada ?? en.pausadaEn ?? ahora
  return Math.max(0, (fin - en.inicio - en.pausaMs) / 1000)
}

/** Para o vuelve a poner en marcha el tiempo de la sesión. */
export function alternarPausa(en: SesionEnCurso, ahora: number): SesionEnCurso {
  return en.pausadaEn === null
    ? { ...en, pausadaEn: ahora }
    : { ...en, pausadaEn: null, pausaMs: en.pausaMs + (ahora - en.pausadaEn) }
}

// El ejercicio que hay que abrir al volver a la sesión («Empezar ejercicio» en su ficha)
let pedido: number | null = null

export function pedirEjercicio(indice: number): void {
  pedido = indice
}

/** El ejercicio pedido desde su ficha (una sola vez: luego se olvida), o null. */
export function tomarPedido(): number | null {
  const i = pedido
  pedido = null
  return i
}

/** Descanso elegido para cada ejercicio (C18): vale en todas las sesiones y semanas siguientes (por nombre del ejercicio). */
export const descansosElegidos = signal<Record<string, number>>({})

export function elegirDescanso(nombre: string, segundos: number): void {
  descansosElegidos.value = { ...descansosElegidos.value, [nombre]: segundos }
}

/** El descanso entre series de un ejercicio: el elegido o, si no, el del plan. */
export const descansoDe = (e: EjercicioPlan) => descansosElegidos.value[e.nombre] ?? e.descanso

/** Vuelve a contar el tiempo desde ahora (si la sesión se empezó sin querer). */
export function contarDesdeAhora(en: SesionEnCurso, ahora: number): SesionEnCurso {
  return { ...en, inicio: ahora, pausaMs: 0, pausadaEn: null }
}

/** El nombre de lo que se hace hoy (el del plan o el que lo sustituye). */
export const nombreHoy = (e: EjercicioPlan, x: EjercicioEnCurso) => x.cambiadoPor ?? e.nombre

/** Lo de la vez anterior: nada si hoy se cambió el ejercicio. */
const antesDe = (e: EjercicioPlan, x: EjercicioEnCurso): SerieHecha[] => (x.cambiadoPor ? [] : e.ultima)

/** Hoy se hace otro ejercicio en su lugar: series vacías, sin calentamiento ni vez anterior. */
export function cambiarEjercicio(en: SesionEnCurso, ej: number, nombre: string): SesionEnCurso {
  return {
    ...en,
    ejercicios: en.ejercicios.map((x, i) =>
      i === ej
        ? { ...x, cambiadoPor: nombre, calentamiento: [], series: x.series.map(() => ({ ...SERIE_VACIA })) }
        : x,
    ),
  }
}

/** Lo que se ve en gris en cada casilla vacía: kilos y reps de la vez anterior y las que deben quedar. */
export function grises(e: EjercicioPlan, x: EjercicioEnCurso, j: number): Record<Campo, string> {
  const antes = antesDe(e, x)[j]
  const previa: string = j > 0 ? x.series[j - 1].kg || grises(e, x, j - 1).kg : ''
  return {
    kg: antes?.kg != null ? formatDecimal(antes.kg) : previa,
    reps: antes ? String(antes.reps) : repsDeSerie(e, j),
    quedan: String(e.rir),
  }
}

/** La serie como números (lo escrito o, si está vacía, lo gris). */
function numeros(e: EjercicioPlan, x: EjercicioEnCurso, j: number): SerieHecha {
  const g = grises(e, x, j)
  const s = x.series[j]
  return { kg: parseDecimal(s.kg || g.kg), reps: parseDecimal(s.reps || g.reps) ?? 0 }
}

export const terminado = (x: EjercicioEnCurso) => x.series.every((s) => s.hecha)

/** La serie está hecha y mejora la misma serie de la vez anterior. */
export const esRecord = (e: EjercicioPlan, x: EjercicioEnCurso, j: number) =>
  x.series[j].hecha && compararConAntes(numeros(e, x, j), antesDe(e, x)[j] ?? null) === 1

/**
 * Cada serie del ejercicio abierto con lo gris de sus casillas, si es récord y sus bajadas o mini-series (en rest-pause, el
 * peso de la serie sale en gris: es el mismo).
 */
export function seriesVistas(e: EjercicioPlan, x: EjercicioEnCurso) {
  return x.series.map((s, j) => {
    const g = grises(e, x, j)
    const extra = (s.extra ?? []).map((y) => ({ ...y, kgGris: e.tecnica === 'pausa' ? s.kg || g.kg : '' }))
    return { ...s, kgGris: g.kg, repsGris: g.reps, quedanGris: g.quedan, record: esRecord(e, x, j), extra }
  })
}

/** La técnica de hoy (dropset o rest-pause); null si no lleva o si hoy se hace otro ejercicio en su lugar. */
export const tecnicaHoy = (e: EjercicioPlan, x: EjercicioEnCurso) =>
  x.cambiadoPor ? null : (e.tecnica ?? null)

/** La pauta del ejercicio en la sesión: «3 series», «8–12 reps», «a 2 del fallo» y, si la lleva, la técnica. */
export function pautaHoy(e: EjercicioPlan, x: EjercicioEnCurso): string[] {
  const tecnica = tecnicaHoy(e, x)
  return [
    `${e.series} series`,
    `${textoReps(e)} reps`,
    effortLabel(e.rir),
    ...(tecnica ? [tecnica === 'pausa' ? 'Rest-pause' : 'Dropset'] : []),
  ]
}

/**
 * Un ejercicio cerrado: pendiente, «Hoy 24 kg · antes 22 kg × 12»; terminado, lo hecho con ★ en las series récord, y
 * si alguna lo fue.
 */
export function filaCerrada(e: EjercicioPlan, x: EjercicioEnCurso) {
  if (!terminado(x)) {
    const antes = e.ultima[0]
    const hoy = sugerenciaDe(e)
    const texto = hoy.kg != null ? `${formatDecimal(hoy.kg)} kg` : `${hoy.reps} reps`
    return {
      estado: 'pendiente' as const,
      resumen: x.cambiadoPor
        ? 'Cambiado solo para hoy'
        : e.ultima.length
          ? `Hoy ${texto} · antes ${antes.kg != null ? `${formatDecimal(antes.kg)} kg × ` : ''}${antes.reps}${antes.kg == null ? ' reps' : ''}`
          : `Primera vez: ${e.reps} reps`,
    }
  }
  const records = x.series.map((_, j) => esRecord(e, x, j))
  return {
    estado: records.some(Boolean) ? ('record' as const) : ('hecho' as const),
    resumen: x.series.map((s, j) => `${records[j] ? '★ ' : ''}${s.kg} kg × ${s.reps}`).join(' · '),
  }
}

/** Los números de una serie para enseñarlos al confirmar («320 kg × 10»). */
export function textoSerie(e: EjercicioPlan, x: EjercicioEnCurso, j: number): string {
  const n = numeros(e, x, j)
  return `${formatDecimal(n.kg ?? 0)} kg × ${n.reps}`
}

export type Apunte =
  | { tipo: 'faltanReps' | 'imposible' | 'alto' }
  | {
      tipo: 'hecha'
      sesion: SesionEnCurso
      /** 1 mejor que la vez anterior, 0 igual, −1 peor, null sin vez anterior. */
      comparacion: -1 | 0 | 1 | null
      /** Segundos de descanso; null tras la última serie de la sesión. */
      descanso: number | null
      bajada: { de: number; a: number } | null
      ejercicioTerminado: boolean
    }

/**
 * Apunta una serie con lo escrito o, si está vacía, con lo gris (un toque basta). Si los números no valen, lo dice
 * sin apuntar. La serie siguiente sin tocar hereda los kilos si cambiaste el peso.
 */
export function apuntarSerie(en: SesionEnCurso, ej: number, j: number, confirmado: boolean): Apunte {
  const e = ejerciciosDe(en)[ej]
  const x = en.ejercicios[ej]
  const g = grises(e, x, j)
  const { kg, reps } = numeros(e, x, j)
  if (!(reps > 0)) return { tipo: 'faltanReps' }
  const revision = revisarNumeros(kg, reps)
  if (revision === 'imposible') return { tipo: 'imposible' }
  if (revision === 'alto' && !confirmado) return { tipo: 'alto' }

  const kgTexto = x.series[j].kg || g.kg
  const cambioPeso = x.series[j].kg !== '' && x.series[j].kg !== g.kg
  const nuevas = x.series.map((s, k) => {
    if (k === j) return { kg: kgTexto, reps: String(reps), quedan: s.quedan || g.quedan, hecha: true }
    if (k === j + 1 && cambioPeso && !s.hecha && !s.kg) return { ...s, kg: kgTexto }
    return s
  })
  const ejercicios = en.ejercicios.map((y, i) => (i === ej ? { ...y, series: nuevas } : y))
  const previas = x.series
    .slice(0, j)
    .filter((s) => s.hecha)
    .map((s) => ({ kg: parseDecimal(s.kg), reps: parseDecimal(s.reps) ?? 0 }))
  const d = descansoTras(descansoDe(e), previas, { kg, reps })
  const fin = ejercicios.every(terminado)
  return {
    tipo: 'hecha',
    sesion: { ...en, ejercicios },
    comparacion: compararConAntes({ kg, reps }, antesDe(e, x)[j] ?? null),
    descanso: fin ? null : d.segundos,
    bajada: fin ? null : d.bajada,
    ejercicioTerminado: nuevas.every((s) => s.hecha),
  }
}

/** Series sin marcar y hechas, para avisar al terminar (C23). */
export function cuentaSeries(en: SesionEnCurso) {
  const todas = en.ejercicios.flatMap((x) => x.series)
  const hechas = todas.filter((s) => s.hecha).length
  return { hechas, total: todas.length, pendientes: todas.length - hechas }
}

/** Lo que se pregunta al terminar (C23): con menos de la mitad hecha, o con series sin marcar; null si está todo. */
export function avisoAlTerminar(en: SesionEnCurso): { titulo: string; texto: string } | null {
  const { hechas, total, pendientes } = cuentaSeries(en)
  if (hechas / total < 0.5) {
    return {
      titulo: '¿Terminar con tan poco?',
      texto: `Solo has hecho ${hechas} de ${total} series. Si terminas, se guarda lo hecho.`,
    }
  }
  if (pendientes) {
    return {
      titulo: '¿Terminar ya?',
      texto: `Te quedan ${pendientes} series sin marcar. Se guarda solo lo hecho.`,
    }
  }
  return null
}

/** El resumen de la sesión terminada (C24): cifras y cada ejercicio frente a la vez anterior. */
export function resumenDe(en: SesionEnCurso) {
  return resumenSesion(
    ejerciciosDe(en).map((e, i) => {
      const x = en.ejercicios[i]
      return {
        nombre: nombreHoy(e, x),
        hechas: x.series
          .filter((s) => s.hecha)
          .map((s) => ({ kg: parseDecimal(s.kg), reps: parseDecimal(s.reps) ?? 0 })),
        antes: antesDe(e, x),
      }
    }),
  )
}
