// Tu objetivo de comida: gasto en reposo, actividad, fase y macros.
// Reglas de docs/conocimiento/02-reglas.md · sección 8 («Gasto y objetivo»). Se calcula una vez y se guarda: después
// solo cambia si tú lo cambias (fase, a mano, tus datos) o si aceptas una sugerencia del entrenador.

export type Sexo = 'hombre' | 'mujer'
export type Fase = 'definicion' | 'volumen' | 'mantenimiento'

export const FASES: { id: Fase; nombre: string; detalle: string }[] = [
  { id: 'definicion', nombre: 'Definición', detalle: 'Perder grasa conservando el músculo' },
  { id: 'volumen', nombre: 'Volumen', detalle: 'Superávit pequeño para ganar músculo' },
  { id: 'mantenimiento', nombre: 'Mantenimiento', detalle: 'Comer lo que gastas' },
]

/** Ritmo de pérdida en definición, en % del peso por semana (0,75 de serie). */
export const RITMOS = [0.5, 0.75, 1] as const
export const RITMO_DE_SERIE = 0.75
/** Proteína y grasa por kilo: de serie, la primera de cada lista. */
export const PROTEINA_G_KG = [1.5, 1.8, 2.2] as const
export const GRASA_G_KG = [0.6, 0.8, 1.0] as const
/** Lo mínimo antes de comer menos (01 `steps`); la guía G1 recomienda 12.000–15.000, los que puedas (decisión 2026-11-08). */
export const PASOS_OBJETIVO = 10_000
export const KCAL_POR_KG = 7_700

export type Cuerpo = { sexo: Sexo; edad: number; alturaCm: number; pesoKg: number }

/**
 * Tu actividad fuera de los pasos y del gimnasio (usuario, 2026-11-19: «tiene en cuenta los pasos pero no el trabajo ni
 * otros deportes»; como otras apps, que separan la vida diaria del ejercicio). Solo para la primera estimación del gasto:
 * después manda lo que se aprende de tus datos (`aprenderGasto`).
 */
export type Trabajo = 'sentado' | 'de-pie' | 'fisico'
export const TRABAJOS: { id: Trabajo; nombre: string; detalle: string }[] = [
  { id: 'sentado', nombre: 'Sentado', detalle: 'Oficina' },
  { id: 'de-pie', nombre: 'De pie', detalle: 'Tienda' },
  { id: 'fisico', nombre: 'Físico', detalle: 'Obra' },
]
/** Lo que el trabajo suma al factor de actividad (sugerido: ningún documento lo fija; los pasos ya cuentan lo que andas). */
const POR_TRABAJO: Record<Trabajo, number> = { sentado: 0, 'de-pie': 0.05, fisico: 0.15 }

export type Intensidad = 'suave' | 'media' | 'intensa'
/** Otros deportes (fútbol, correr, nadar…): horas a la semana y cómo de fuerte. */
export type Deporte = { horas: number; intensidad: Intensidad }
/** MET de cada intensidad (sugerido, del compendio de actividades: suave como andar rápido, intensa como correr). */
export const MET: Record<Intensidad, number> = { suave: 4, media: 6, intensa: 8 }

/** Las kcal al día de otros deportes: MET × kg × horas a la semana ÷ 7 (02-reglas, «Cardio»). */
export function kcalDeDeporte(pesoKg: number, d: Deporte | null | undefined): number {
  if (!d || d.horas <= 0) return 0
  return Math.round((MET[d.intensidad] * pesoKg * d.horas) / 7)
}

/**
 * Lo que se aprende de tus datos (02-reglas, «Revisión semanal automática»): nuevo gasto = 0,6 × el anterior + 0,4 × lo
 * observado, entre basal × 1,1 y × 2,6. Así sigue a tu metabolismo cuando cambia, sin saltos de una semana a otra.
 */
export function aprenderGasto(anterior: number, observado: number, basal: number): number {
  const nuevo = 0.6 * anterior + 0.4 * observado
  return Math.round(Math.min(basal * 2.6, Math.max(basal * 1.1, nuevo)))
}

/** Mifflin-St Jeor: 10 × kg + 6,25 × cm − 5 × edad + 5 (hombre) o − 161 (mujer). */
export function gastoEnReposo(c: Cuerpo): number {
  return Math.round(10 * c.pesoKg + 6.25 * c.alturaCm - 5 * c.edad + (c.sexo === 'hombre' ? 5 : -161))
}

/**
 * Factor de actividad: 1,25 + 0,045 por cada 1.000 pasos sobre 3.000 (hasta 8.000 más) + 0,03 por día de entreno,
 * entre 1,3 y 1,95; y encima, lo de tu trabajo (sugerido). Con dos decimales.
 */
export function factorActividad(pasos: number, diasEntreno: number, trabajo: Trabajo = 'sentado'): number {
  const miles = Math.min(8, Math.max(0, (pasos - 3000) / 1000))
  const f = 1.25 + 0.045 * miles + 0.03 * diasEntreno
  // El trabajo, encima de lo de los pasos y los entrenos (sugerido)
  return Math.round((Math.min(1.95, Math.max(1.3, f)) + POR_TRABAJO[trabajo]) * 100) / 100
}

/** Lo mínimo que se come en definición: el mayor de basal × 1,1 y 1.500 (hombre) o 1.200 (mujer). */
export function suelo(basal: number, sexo: Sexo): number {
  return Math.round(Math.max(basal * 1.1, sexo === 'hombre' ? 1500 : 1200))
}

/** Déficit diario para bajar `ritmo` % del peso por semana (7.700 kcal por kilo). */
export function deficitDiario(pesoKg: number, ritmo: number): number {
  return Math.round(((ritmo / 100) * pesoKg * KCAL_POR_KG) / 7)
}

/**
 * Velocidad del volumen, en % del peso al mes (usuario, 2026-11-19: «con mucha precaución para no ponerse gordo»): la
 * normal, 0,375 %, es la de 02-reglas; la lenta y la rápida son sugeridas, y la rápida no pasa del 0,5 %: subir más
 * deprisa no gana más músculo, solo más grasa.
 */
export const RITMOS_VOLUMEN = [0.25, 0.375, 0.5] as const
export const RITMO_VOLUMEN_DE_SERIE = 0.375

/** Superávit diario en volumen: el mayor de 75 kcal y `ritmoMes` % del peso al mes (de serie, 0,375 %). */
export function superavitDiario(pesoKg: number, ritmoMes: number = RITMO_VOLUMEN_DE_SERIE): number {
  return Math.round(Math.max(75, ((ritmoMes / 100) * pesoKg * KCAL_POR_KG) / 30))
}

export type Calculo = {
  basal: number
  factor: number
  /** Las kcal al día de otros deportes (ya sumadas en el gasto). */
  deporte: number
  gasto: number
  /** El gasto sale de tus datos (lo aprendido), no de la fórmula. */
  aprendido: boolean
  /** Lo que la fase quita (negativo) o suma al gasto. */
  cambio: number
  suelo: number
  kcal: number
  /** El objetivo es el suelo: el déficit pedido bajaba de él. */
  enSuelo: boolean
}

/** El objetivo de kcal desde tus datos: gasto (basal × actividad) y la fase. */
export function calcularObjetivo(datos: {
  cuerpo: Cuerpo
  pasos: number
  diasEntreno: number
  fase: Fase
  ritmo: number
  trabajo?: Trabajo
  deporte?: Deporte | null
  /** En volumen, % del peso al mes (de serie, 0,375). */
  ritmoVolumen?: number
  /** Lo que gastas según tus datos; manda sobre la fórmula (02-reglas: «hasta aprender el real»). */
  gastoAprendido?: number | null
}): Calculo {
  const basal = gastoEnReposo(datos.cuerpo)
  const factor = factorActividad(datos.pasos, datos.diasEntreno, datos.trabajo)
  const deporte = kcalDeDeporte(datos.cuerpo.pesoKg, datos.deporte)
  const aprendido = !!datos.gastoAprendido
  const gasto = datos.gastoAprendido || Math.round(basal * factor) + deporte
  const minimo = suelo(basal, datos.cuerpo.sexo)
  const cambio =
    datos.fase === 'definicion'
      ? -deficitDiario(datos.cuerpo.pesoKg, datos.ritmo)
      : datos.fase === 'volumen'
        ? superavitDiario(datos.cuerpo.pesoKg, datos.ritmoVolumen)
        : 0
  const pedido = gasto + cambio
  const enSuelo = datos.fase === 'definicion' && pedido < minimo
  return {
    basal,
    factor,
    deporte,
    gasto,
    aprendido,
    cambio,
    suelo: minimo,
    kcal: enSuelo ? minimo : pedido,
    enSuelo,
  }
}

/**
 * Cómo repartes tus kcal: proteína y grasa por kilo de tu peso o, si las pones a mano, en gramos fijos (`proteinaG`,
 * `grasaG`; null o sin poner = por kilo). Los hidratos siempre son lo que queda.
 */
export type Reparto = {
  proteinaGKg: number
  grasaGKg: number
  proteinaG?: number | null
  grasaG?: number | null
}

/** Proteína y grasa por kilo o en gramos fijos; los hidratos, lo que queda. En gramos enteros. */
export function macrosObjetivo(kcal: number, pesoKg: number, r: Reparto) {
  const protein = Math.round(r.proteinaG ?? r.proteinaGKg * pesoKg)
  const fat = Math.round(r.grasaG ?? r.grasaGKg * pesoKg)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { kcal, protein, carbs, fat }
}

/**
 * Lo que dicen tus documentos (docs/conocimiento/01-contenido.md y la guía de culturismo natural): proteína ~1,5 g/kg
 * basta y solo sube (hasta ~2 g/kg) si el volumen de comida lo obliga, más baja en definición que en volumen (guía G1,
 * decisión 2026-11-08); grasa ~0,6 g/kg como suelo; el resto, a hidratos, que tienen prioridad.
 */
export const RANGO_PROTEINA_G_KG = { min: 1.5, max: 2 } as const
export const SUELO_GRASA_G_KG = 0.6
/** Hasta dónde llegan los selectores, en g/kg. */
export const LIMITES_G_KG = { proteina: { min: 1, max: 3 }, grasa: { min: 0.3, max: 1.5 } } as const

/** Avisos (no impiden guardar) cuando el reparto se sale de lo que dicen tus documentos. */
export function avisosReparto(pesoKg: number, m: { protein: number; fat: number; carbs: number }): string[] {
  const avisos: string[] = []
  const p = m.protein / pesoKg
  if (p < RANGO_PROTEINA_G_KG.min - 0.005)
    avisos.push('Proteína por debajo de 1,5 g/kg: puede costarte conservar el músculo.')
  if (p > RANGO_PROTEINA_G_KG.max + 0.005)
    avisos.push(
      'Proteína por encima de 2 g/kg: solo si el volumen de comida te obliga; si no, le quita sitio a los hidratos.',
    )
  if (m.fat / pesoKg < SUELO_GRASA_G_KG - 0.005)
    avisos.push('Grasa por debajo de 0,6 g/kg: es el suelo, por tu salud hormonal.')
  if (m.carbs === 0) avisos.push('No te quedan kcal para hidratos: baja la proteína o la grasa.')
  return avisos
}

/** Límites de lo que se puede fijar a mano (los del prototipo). */
export const KCAL_A_MANO = { min: 1000, max: 6000 } as const

export function kcalAManoValidas(kcal: number): boolean {
  return Number.isInteger(kcal) && kcal >= KCAL_A_MANO.min && kcal <= KCAL_A_MANO.max
}

/** Tus datos están completos y dentro de lo razonable. */
export function cuerpoValido(c: Partial<Cuerpo>): c is Cuerpo {
  return (
    (c.sexo === 'hombre' || c.sexo === 'mujer') &&
    typeof c.edad === 'number' &&
    c.edad >= 14 &&
    c.edad <= 100 &&
    typeof c.alturaCm === 'number' &&
    c.alturaCm >= 120 &&
    c.alturaCm <= 230 &&
    typeof c.pesoKg === 'number' &&
    c.pesoKg >= 30 &&
    c.pesoKg <= 300
  )
}

/**
 * Hidratos según el día (ON/OFF, guía de culturismo natural §6, decisión 2026-11-09): los días de entreno comen más y los
 * de descanso menos, solo en hidratos, con la misma media semanal (tu déficit, volumen o mantenimiento no cambia). La
 * diferencia entre un día de entreno y uno de descanso, en parte de tus kcal: la guía no da cifra (su gráfica es
 * ilustrativa, ~20 %; al salir de competir, menos del 10 %). Sugerido: 10 %.
 */
export const DIFERENCIAS_ON_OFF = [0.1, 0.15, 0.2] as const
export const DIFERENCIA_DE_SERIE = 0.1

/** Las kcal de un día con ON/OFF: `diasEntreno` de los 7 de su semana; si entrenas 0 o 7 días, las de siempre. */
export function kcalDelDia(kcal: number, entreno: boolean, diasEntreno: number, diferencia: number): number {
  if (diasEntreno <= 0 || diasEntreno >= 7 || diferencia <= 0) return kcal
  const descanso = kcal - (diasEntreno * diferencia * kcal) / 7
  return Math.round(entreno ? descanso + diferencia * kcal : descanso)
}

/**
 * Velocidad por fases en definición (optativo; guía: rápido al principio y suave al final; las cifras son sugeridas):
 * semanas 1–4, tu velocidad + 0,25 (máx. 1 %); 5–8, la tuya; desde la 9, − 0,25 (mín. 0,5 %).
 */
export const TRAMOS_SEMANAS = { rapido: 4, medio: 8 } as const
export function ritmoDeLaSemana(ritmo: number, semana: number): number {
  const r = (n: number) => Math.round(n * 100) / 100
  if (semana <= TRAMOS_SEMANAS.rapido) return r(Math.min(1, ritmo + 0.25))
  if (semana <= TRAMOS_SEMANAS.medio) return ritmo
  return r(Math.max(0.5, ritmo - 0.25))
}

/** Semana de la fase (la 1 es la primera) desde que empezó. */
export const semanaDeLaFase = (desde: string, hoy: string) =>
  Math.floor(
    (new Date(`${hoy}T12:00:00`).getTime() - new Date(`${desde}T12:00:00`).getTime()) / (7 * 86_400_000),
  ) + 1

/**
 * Volver de un parón o salir de una definición: se come lo de mantenimiento y, cada vez que el peso se estabiliza, se
 * sube +200 kcal en hidratos (docs/conocimiento: «reverse»). Tras un parón, dos mesetas y después ya se puede definir.
 */
export type Situacion = 'paron' | 'salida'
export const SUBIDA_MESETA = 200
export const MESETAS_PARON = 2

/**
 * Etapa final de la definición (desde la semana 9, como la fase final de la consulta): ya estás bastante definido y la app
 * no aprieta: velocidad como mucho −0,75 % por semana y, si hay que bajar, −100 kcal en vez de −150 (decisión 2026-11-09:
 * apretar mucho con poca grasa cuesta músculo y rendimiento; cifras sugeridas).
 */
export const SEMANA_FINAL = 9
export const RITMO_MAX_FINAL = 0.75
export const BAJADA_FINAL = 100
