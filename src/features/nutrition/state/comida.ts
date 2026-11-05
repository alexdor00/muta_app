// Lo que se ve de Comida: tus ajustes, lo apuntado, tus pesajes y lo que propone el entrenador. Lo carga y guarda
// use-cases/nutritionStore.ts; aquí no se guarda nada.
import { computed, signal } from '@preact/signals'
import { addDays, localDate } from '../../../shared/lib/format.ts'
import { porComida, sumar, type Alimento, type Apunte, type Macros } from '../domain/food.ts'
import { revisar, type Revision } from '../domain/review.ts'
import {
  calcularObjetivo,
  gastoEnReposo,
  macrosObjetivo,
  suelo,
  type Cuerpo,
  type Fase,
} from '../domain/targets.ts'
import { resumenSemana } from '../domain/week.ts'
import { gastoMedido, ritmoSemanal, tendencia, type Pesaje } from '../domain/weight.ts'

// Lo que las pantallas necesitan del dominio (no lo importan directamente)
export {
  cantidadAlCambiar,
  COMIDAS,
  comidaPorHora,
  macrosIncompletos,
  modoInicial,
  pasoDe,
} from '../domain/food.ts'
export type { Alimento, Apunte, ComidaId, Macros, Modo } from '../domain/food.ts'
export {
  cuerpoValido,
  FASES,
  RITMOS,
  KCAL_A_MANO,
  type Fase,
  type Sexo,
  type Cuerpo,
} from '../domain/targets.ts'
export { letraDia } from '../domain/week.ts'
export { ritmoPrevisto, tituloCambio } from '../domain/review.ts'

/** Tus datos y tu objetivo (en `userContent`, id «nutricion»). */
export type Ajustes = {
  id: 'nutricion'
  target: 'nutricion'
  /** Tus datos; el peso es el del último cálculo (los pesajes van aparte, en `bodyLog`). */
  cuerpo: Cuerpo
  pasos: number
  diasEntreno: number
  fase: Fase
  ritmo: number
  proteinaGKg: number
  grasaGKg: number
  /** Tu objetivo de kcal desde `desde`; antes de esa fecha, `kcalAnterior`. */
  kcal: number
  kcalAnterior: number | null
  desde: string
  aMano: boolean
  creado: string
}

/** Un cambio de tu objetivo o una sugerencia del entrenador (almacén `coach`). */
export type Cambio = {
  id: string
  area: 'nutricion'
  /** pendiente → aplicado o descartado; aplicado → deshecho. Lo que haces tú: hecho. */
  status: 'pendiente' | 'aplicado' | 'descartado' | 'deshecho' | 'hecho'
  tipo: 'inicio' | 'fase' | 'mano' | 'datos' | 'sugerencia' | 'sin-cambios'
  fecha: string
  de: number | null
  a: number
  texto: string
  /** Solo en las sugerencias: lo que vio el entrenador. */
  revision?: Extract<Revision, { tipo: 'cambio' }>
  /** Para deshacer: el objetivo de antes. */
  antes?: Pick<Ajustes, 'kcal' | 'kcalAnterior' | 'desde' | 'aMano'>
  createdAt: string
  updatedAt: string
}

export type ComidaGuardada = { id: string; nombre: string; apuntes: Apunte[] }

export const ajustes = signal<Ajustes | null>(null)
/** Lo apuntado por día (las últimas 5 semanas). */
export const dias = signal<Record<string, Apunte[]>>({})
export const pesajes = signal<Pesaje[]>([])
export const cambios = signal<Cambio[]>([])
export const propios = signal<Alimento[]>([])
export const guardadas = signal<ComidaGuardada[]>([])
/** La base de alimentos (se descarga al abrir «Añadir»). */
export const base = signal<Alimento[] | null>(null)
export const estado = signal<'cargando' | 'listo'>('cargando')

export const hoy = signal(localDate())

/** El objetivo de un día (con su fecha de inicio: una sugerencia aplicada vale desde mañana). */
export function objetivoDe(a: Ajustes, fecha: string): Macros {
  const kcal = fecha < a.desde && a.kcalAnterior !== null ? a.kcalAnterior : a.kcal
  return macrosObjetivo(kcal, a.cuerpo.pesoKg, a.proteinaGKg, a.grasaGKg)
}

export const objetivoHoy = computed(() => (ajustes.value ? objetivoDe(ajustes.value, hoy.value) : null))
export const apuntesHoy = computed(() => dias.value[hoy.value] ?? [])
export const totalHoy = computed(() => sumar(apuntesHoy.value))
export const serie = computed(() => tendencia(pesajes.value))

export const totales = computed(() =>
  Object.fromEntries(Object.entries(dias.value).map(([d, a]) => [d, sumar(a)])),
)

export const semana = computed(() =>
  objetivoHoy.value ? resumenSemana(totales.value, hoy.value, objetivoHoy.value) : null,
)

/** Cómo sale tu objetivo, con tus datos de ahora (lo que se enseña en «Tu objetivo»). */
export const calculo = computed(() => {
  const a = ajustes.value
  return a ? calcularObjetivo(a) : null
})

/** Lo que gastas medido con tus datos (null hasta tener 8 pesajes y 8 días de comida en 14). */
export const gastoReal = computed(() => {
  const a = ajustes.value
  if (!a) return null
  return gastoMedido({
    serie: serie.value,
    dias: Object.entries(totales.value).map(([date, t]) => ({ date, kcal: t.kcal })),
    hoy: hoy.value,
    basal: gastoEnReposo(a.cuerpo),
  })
})

/** Lo que vería hoy la revisión semanal (en vivo: faltan datos, vas bien, pasos…). */
export const revisionDeHoy = computed<Revision | null>(() => {
  const a = ajustes.value
  if (!a) return null
  return revisar({
    hoy: hoy.value,
    fase: a.fase,
    ritmo: a.ritmo,
    kcal: a.kcal,
    suelo: suelo(gastoEnReposo(a.cuerpo), a.cuerpo.sexo),
    pasos: a.pasos,
    serie: serie.value,
    dias: Object.entries(totales.value).map(([date, t]) => ({ date, kcal: t.kcal })),
    ultimoCambio: a.desde,
  })
})

/** La sugerencia que espera tu respuesta. */
export const pendiente = computed(() => cambios.value.find((c) => c.status === 'pendiente') ?? null)

/** Historial: lo más nuevo arriba. */
export const historial = computed(() =>
  [...cambios.value].sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
)

/** Las comidas de hoy, cada una con lo suyo y su suma. */
export const comidasHoy = computed(() =>
  porComida(apuntesHoy.value).map((c) => ({ ...c, total: sumar(c.apuntes) })),
)

/** Tu ritmo de peso de las dos últimas semanas (null sin pesajes suficientes). */
export const ritmoHoy = computed(() => ritmoSemanal(serie.value, hoy.value))

/** Lo de ayer en una comida (para «Repetir»). */
export function deAyer(comida: Apunte['comida']): Apunte[] {
  return (dias.value[addDays(hoy.value, -1)] ?? []).filter((x) => x.comida === comida)
}

/** Un alimento por su id: los tuyos y los de la base. */
export function alimentoPorId(id: string): Alimento | null {
  return propios.value.find((a) => a.id === id) ?? base.value?.find((a) => a.id === id) ?? null
}
