// Lo que se ve de Comida: tus ajustes, lo apuntado, tus pesajes y lo que propone el entrenador. Lo carga y guarda
// use-cases/nutritionStore.ts; aquí no se guarda nada.
import { computed, signal } from '@preact/signals'
import { addDays, formatDayDate, localDate } from '../../../shared/lib/format.ts'
import { enRecarga, recargaEfectiva, type Recarga } from '../domain/refeed.ts'
import { diaDeDieta, repartoSinRutina, type DietaActiva, type TipoDia } from '../domain/diet.ts'
import { porComida, sumar, type Alimento, type Apunte, type Macros } from '../domain/food.ts'
import type { Revision } from '../domain/review.ts'
import {
  type Deporte,
  type Trabajo,
  calcularObjetivo,
  macrosObjetivo,
  type Cuerpo,
  type Fase,
  kcalDelDia,
  type Situacion,
} from '../domain/targets.ts'
import { tendencia, type Pesaje } from '../domain/weight.ts'
import { conTiposDeDia } from '../domain/menu.ts'

// Lo que las pantallas necesitan del dominio (no lo importan directamente)
export {
  cantidadAlCambiar,
  COMIDAS,
  comidaPorHora,
  macrosDe,
  macrosIncompletos,
  modoInicial,
  nombreRacion,
  pasoDe,
  porPiezas,
  unidadDe,
} from '../domain/food.ts'
export type { Alimento, Apunte, ComidaId, Macros, Modo } from '../domain/food.ts'
export { enRecarga, type Recarga } from '../domain/refeed.ts'
export {
  avisosReparto,
  RITMOS_VOLUMEN,
  RITMO_VOLUMEN_DE_SERIE,
  TRABAJOS,
  type Intensidad,
  RITMO_MAX_FINAL,
  SEMANA_FINAL,
  semanaDeLaFase,
  MESETAS_PARON,
  ritmoDeLaSemana,
  SUBIDA_MESETA,
  type Situacion,
  kcalDelDia,
  DIFERENCIAS_ON_OFF,
  DIFERENCIA_DE_SERIE,
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
  /** Hidratos según el día (ON/OFF): la diferencia entre un día de entreno y uno de descanso (0,1 = 10 % de tus kcal); null o sin poner, apagado. */
  onOff?: number | null
  /** Desde cuándo estás en tu fase (la semana 1 es la primera); sin poner, desde que creaste tu objetivo. */
  faseDesde?: string
  /** Velocidad por fases en definición, y la velocidad con la que están calculadas tus kcal ahora (la de la etapa). */
  porFases?: boolean
  ritmoTramo?: number | null
  /** En mantenimiento: vuelves de un parón o sales de una definición, y las mesetas que llevas. */
  situacion?: Situacion | null
  mesetas?: number
  /** La recarga de hidratos (la última o la que llevas) y cuándo dijiste «Ahora no» a la propuesta. */
  recarga?: Recarga | null
  recargaDescartada?: string | null
  /** Tus kcal al empezar la fase en que estás, y cómo fue tu última definición (usuario, 2026-11-22: para empezar la
   * siguiente con eso en cuenta; la guía, § 7: «si se atraganta, empezar más abajo la siguiente vez»). */
  kcalAlEmpezar?: number | null
  ultimaDefinicion?: {
    desde: string
    hasta: string
    kcalInicio: number | null
    kcalFinal: number
    atragantada?: boolean
  } | null
  /** En volumen, a qué velocidad: % del peso al mes (RITMOS_VOLUMEN; de serie, 0,375). */
  ritmoVolumen?: number
  /** Quitaste «Aún no tienes menú para hoy»: no quieres seguir un menú y no vuelve a salir (usuario, 2026-11-19). */
  sinAvisoMenu?: boolean
  /** Tu trabajo y otros deportes (usuario, 2026-11-19): solo para la primera estimación del gasto. */
  trabajo?: Trabajo
  deporte?: Deporte | null
  /** Lo que gastas según tus datos (se aprende cada semana: `aprenderDeTusDatos`) y cuándo se aprendió por última vez. */
  gastoAprendido?: number | null
  gastoFecha?: string | null
  /** Los días que cambiaste a mano, de entreno o de descanso, sin dieta cargada (con dieta, los guarda ella). */
  tipoElegido?: Record<string, TipoDia>
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
  antes?: Pick<Ajustes, 'kcal' | 'kcalAnterior' | 'desde' | 'aMano'> &
    Partial<
      Pick<Ajustes, 'fase' | 'faseDesde' | 'situacion' | 'mesetas' | 'kcalAlEmpezar' | 'ultimaDefinicion'>
    >
  createdAt: string
  updatedAt: string
}

export type ComidaGuardada = { id: string; nombre: string; apuntes: Apunte[] }

export const ajustes = signal<Ajustes | null>(null)

/** La recarga de hidratos con su fin de verdad (cuenta tus entrenos hechos); null si no hay. */
export function recargaActiva(a: Ajustes | null = ajustes.value): Recarga | null {
  return recargaEfectiva(a?.recarga, (f) => tipoDe(f) === 'entreno')
}
/** Lo apuntado por día (las últimas 5 semanas). */
export const dias = signal<Record<string, Apunte[]>>({})
export const pesajes = signal<Pesaje[]>([])
/** Tus pasos de cada día (los apuntas en Hoy). */
export const pasosDias = signal<Record<string, number>>({})
export const cambios = signal<Cambio[]>([])
export const propios = signal<Alimento[]>([])
export const guardadas = signal<ComidaGuardada[]>([])
/** La base de alimentos (se descarga al abrir «Añadir»). */
export const base = signal<Alimento[] | null>(null)
export const estado = signal<'cargando' | 'listo'>('cargando')

export const hoy = signal(localDate())
/** El día que ves en Comida · Hoy (con ‹ › se ven otros); lo que apuntas va a ese día. */
export const diaVisto = signal(localDate())

/** Días de entreno de la semana (lunes a domingo) de una fecha, según tu rutina. */
export function entrenosDeLaSemana(fecha: string): number {
  const dia = (new Date(`${fecha}T12:00:00`).getDay() + 6) % 7
  let n = 0
  for (let k = 0; k < 7; k++) if (tipoDe(addDays(fecha, k - dia)) === 'entreno') n++
  return n
}

/**
 * Tus kcal de un día sin ON/OFF (con su fecha de inicio: una sugerencia aplicada vale desde mañana). En una recarga de
 * hidratos, las de mantenimiento (la proteína y la grasa no cambian: lo de más va a hidratos).
 */
const kcalBase = (a: Ajustes, fecha: string) =>
  // Solo los días que entrenas (usuario, 2026-11-22): los de descanso, y los que no entrenas, siguen en definición
  enRecarga(recargaActiva(a), fecha) && tipoDe(fecha) === 'entreno'
    ? calcularObjetivo({ ...a, fase: 'mantenimiento' }).kcal
    : fecha < a.desde && a.kcalAnterior !== null
      ? a.kcalAnterior
      : a.kcal

/**
 * El objetivo de un día. Con hidratos según el día (ON/OFF), los días de entreno llevan más hidratos y los de descanso
 * menos, con la misma media semanal; la proteína y la grasa no cambian.
 */
export function objetivoDe(a: Ajustes, fecha: string, diferencia = a.onOff ?? 0): Macros {
  const deSiempre = kcalBase(a, fecha)
  const kcal = diferencia
    ? kcalDelDia(deSiempre, tipoDe(fecha) === 'entreno', entrenosDeLaSemana(fecha), diferencia)
    : deSiempre
  return macrosObjetivo(kcal, a.cuerpo.pesoKg, a)
}

/** Tus kcal de un día de entreno y de uno de descanso esa semana (con ON/OFF, distintas; sin él, las mismas). */
export function kcalPorTipo(a: Ajustes, fecha: string): Record<'entreno' | 'descanso', number> {
  const deSiempre = kcalBase(a, fecha)
  const n = entrenosDeLaSemana(fecha)
  const dif = a.onOff ?? 0
  return { entreno: kcalDelDia(deSiempre, true, n, dif), descanso: kcalDelDia(deSiempre, false, n, dif) }
}

/**
 * La nota de los hidratos de un día (en Tu objetivo, usuario 2026-11-17): los días de entreno, ponerlos sobre todo antes y después de entrenar (guía:
 * timing de hidratos) y, con ON/OFF, cuántos gramos más o menos lleva. null si no hay nada que decir (o sigues una dieta).
 */
export function notaHidratos(fecha: string): string | null {
  if (dieta.value || !ajustes.value) return null
  const r = recargaActiva()
  if (enRecarga(r, fecha) && r)
    return tipoDe(fecha) === 'entreno'
      ? `Recarga de hidratos hasta el ${formatDayDate(r.hasta)}: hoy entrenas, comes lo de mantenimiento con todo lo de más en hidratos.`
      : `Recarga de hidratos hasta el ${formatDayDate(r.hasta)}: hoy no entrenas, tus kcal de definición.`
  const h = hidratosDelDia(fecha)
  const cambio = h ? `${h.gramos > 0 ? '+' : '−'}${Math.abs(h.gramos)} g de hidratos. ` : ''
  if (tipoDe(fecha) === 'entreno')
    return `Día de entreno: ${cambio}Se recomienda comer la mayor parte de los hidratos antes y después de entrenar.`
  return h ? `Día de descanso: ${cambio}Tu semana sigue en tu objetivo.` : null
}

/** Con ON/OFF, cuántos gramos de hidratos más (o menos) lleva ese día frente a tu objetivo de siempre; null si está apagado. */
export function hidratosDelDia(fecha: string): { entreno: boolean; gramos: number } | null {
  const a = ajustes.value
  if (!a?.onOff || dieta.value) return null
  const gramos = objetivoDe(a, fecha).carbs - objetivoDe(a, fecha, 0).carbs
  return gramos ? { entreno: tipoDe(fecha) === 'entreno', gramos } : null
}

/** La dieta que sigues (null si no sigues ninguna). */
export const dieta = signal<DietaActiva | null>(null)
/** Qué días son de entreno según tu rutina de Entreno (null si no tienes rutina). */
export const tiposEntreno = signal<Record<string, TipoDia> | null>(null)

/** Si un día es de entreno o de descanso: lo que elegiste, lo de tu rutina o, sin rutina, tus días repartidos. */
export function tipoDe(fecha: string): TipoDia {
  return (
    dieta.value?.tipoElegido[fecha] ??
    ajustes.value?.tipoElegido?.[fecha] ??
    tiposEntreno.value?.[fecha] ??
    repartoSinRutina(fecha, ajustes.value?.diasEntreno ?? 4)
  )
}

// Tus platos de descanso (domain/menu.ts) siguen a este tipo de día
conTiposDeDia((f) => tipoDe(f) === 'descanso')

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
/** Lo que llevas un día cualquiera (las tarjetas del carrusel de días). */
export const totalDe = (fecha: string) => sumar(dias.value[fecha] ?? [])
export const serie = computed(() => tendencia(pesajes.value))

export const totales = computed(() =>
  Object.fromEntries(Object.entries(dias.value).map(([d, a]) => [d, sumar(a)])),
)

/** Cómo sale tu objetivo, con tus datos de ahora (lo que se enseña en «Tu objetivo»). */
export const calculo = computed(() => {
  const a = ajustes.value
  return a ? calcularObjetivo(a) : null
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
