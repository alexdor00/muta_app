// Lo que se ve de Comida: tus ajustes, lo apuntado, tus pesajes y lo que propone el entrenador. Lo carga y guarda
// use-cases/nutritionStore.ts; aquí no se guarda nada.
import { computed, signal } from '@preact/signals'
import { addDays, localDate } from '../../../shared/lib/format.ts'
import { diaDeDieta, repartoSinRutina, type DietaActiva, type TipoDia } from '../domain/diet.ts'
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
import { gastoMedido, tendencia, type Pesaje } from '../domain/weight.ts'

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
  avisosReparto,
  cuerpoValido,
  FASES,
  RITMOS,
  KCAL_A_MANO,
  LIMITES_G_KG,
  macrosObjetivo,
  type Reparto,
  type Fase,
  type Sexo,
  type Cuerpo,
} from '../domain/targets.ts'
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
  /** Proteína y grasa en gramos fijos, si las pones a mano (si no, por kilo). */
  proteinaG?: number | null
  grasaG?: number | null
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
  tipo: 'inicio' | 'fase' | 'mano' | 'datos' | 'sugerencia' | 'sin-cambios' | 'dieta'
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
/** El día que ves en Comida · Hoy (con ‹ › se ven otros); lo que apuntas va a ese día. */
export const diaVisto = signal(localDate())

/** El objetivo de un día (con su fecha de inicio: una sugerencia aplicada vale desde mañana). */
export function objetivoDe(a: Ajustes, fecha: string): Macros {
  const kcal = fecha < a.desde && a.kcalAnterior !== null ? a.kcalAnterior : a.kcal
  return macrosObjetivo(kcal, a.cuerpo.pesoKg, a)
}

/** La dieta que sigues (null si no sigues ninguna). */
export const dieta = signal<DietaActiva | null>(null)
/** Qué días son de entreno según tu rutina de Entreno (null si no tienes rutina). */
export const tiposEntreno = signal<Record<string, TipoDia> | null>(null)

/** Si un día es de entreno o de descanso: lo que elegiste, lo de tu rutina o, sin rutina, tus días repartidos. */
export function tipoDe(fecha: string): TipoDia {
  return (
    dieta.value?.tipoElegido[fecha] ??
    tiposEntreno.value?.[fecha] ??
    repartoSinRutina(fecha, ajustes.value?.diasEntreno ?? 4)
  )
}

/** El objetivo de un día: con dieta, lo que suman sus recetas (si ya tiene); si no, tu objetivo de kcal. */
export function objetivoDelDia(fecha: string): Macros | null {
  const conDieta = dieta.value ? diaDeDieta(dieta.value, fecha, tipoDe(fecha)).total : null
  if (conDieta && conDieta.kcal > 0) return conDieta
  return ajustes.value ? objetivoDe(ajustes.value, fecha) : null
}

export const objetivoHoy = computed(() => objetivoDelDia(hoy.value))
/** Lo del día que ves. */
export const objetivoDia = computed(() => objetivoDelDia(diaVisto.value))
export const apuntesDia = computed(() => dias.value[diaVisto.value] ?? [])
export const totalDia = computed(() => sumar(apuntesDia.value))
export const serie = computed(() => tendencia(pesajes.value))

export const totales = computed(() =>
  Object.fromEntries(Object.entries(dias.value).map(([d, a]) => [d, sumar(a)])),
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

/** Cambio de tu fuerza en los básicos (de Entreno); null hasta cargarlo o sin datos. */
export const fuerzaBasicos = signal<number | null>(null)

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
    fuerza: fuerzaBasicos.value,
  })
})

/** La sugerencia que espera tu respuesta. */
export const pendiente = computed(() => cambios.value.find((c) => c.status === 'pendiente') ?? null)

/** Historial: lo más nuevo arriba. */
export const historial = computed(() =>
  [...cambios.value].sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
)

/** Las comidas del día que ves, cada una con lo suyo y su suma. */
export const comidasDia = computed(() =>
  porComida(apuntesDia.value).map((c) => ({ ...c, total: sumar(c.apuntes) })),
)

/** Lo del día anterior al que ves en una comida (para «Repetir»). */
export function deAyer(comida: Apunte['comida']): Apunte[] {
  return (dias.value[addDays(diaVisto.value, -1)] ?? []).filter((x) => x.comida === comida)
}

/** Un alimento por su id: los tuyos y los de la base. */
export function alimentoPorId(id: string): Alimento | null {
  return propios.value.find((a) => a.id === id) ?? base.value?.find((a) => a.id === id) ?? null
}
