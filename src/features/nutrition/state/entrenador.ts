// El entrenador de tu objetivo (usuario, 2026-11-22: «como un entrenador real»): lo que gastas de verdad, la revisión
// semanal con todas sus señales (tu peso, tu cintura y tus perímetros, tu fuerza, cómo estás, tu proteína) y la recarga de
// hidratos. Lo calculado aquí; las reglas, en domain/review.ts, domain/senales.ts y domain/refeed.ts.
import { computed, signal } from '@preact/signals'
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import type { CuerpoParaComida } from '../../progress/index.ts'
import { finDeRecarga, tocaRecarga, type RendimientoReciente } from '../domain/refeed.ts'
import { revisar, trasRecarga, type Revision } from '../domain/review.ts'
import { consejosDeLaSemana, grasaFinal, proteinaPorKilo, semanasConSenales } from '../domain/senales.ts'
import { calcularObjetivo, gastoEnReposo, SEMANA_FINAL, semanaDeLaFase, suelo } from '../domain/targets.ts'
import { gastoMedido } from '../domain/weight.ts'
import {
  ajustes,
  dieta,
  enRecarga,
  hoy,
  objetivoDe,
  objetivoDelDia,
  recargaActiva,
  serie,
  tipoDe,
  tiposEntreno,
  totales,
} from './comida.ts'

// Lo que las pantallas necesitan de las reglas del entrenador
export { FUERZA_BAJA, NOMBRE_SENAL, RAPIDO_PCT } from '../domain/senales.ts'
export type { Revision } from '../domain/review.ts'

/** Lo que gastas medido con tus datos (null hasta tener 8 pesajes y 8 días de comida en 14). */
export const gastoReal = computed(() => {
  const a = ajustes.value
  if (!a) return null
  // Sin los días de una recarga ni las dos semanas de después (el agua de los hidratos lo falsearía): no se aprende
  const r = recargaActiva(a)
  if (r && trasRecarga({ desde: r.desde, hasta: addDays(r.hasta, 14) }, hoy.value)) return null
  return gastoMedido({
    serie: serie.value,
    dias: Object.entries(totales.value).map(([date, t]) => ({ date, kcal: t.kcal })),
    hoy: hoy.value,
    basal: gastoEnReposo(a.cuerpo),
  })
})

/** Cambio de tu fuerza en los básicos (de Entreno); null hasta cargarlo o sin datos. */
export const fuerzaBasicos = signal<number | null>(null)

/** Lo que da Entreno: si vuelves de un parón y cuándo te subió series (null hasta cargarlo). */
export const deEntreno = signal<{ paron: boolean; cambioEntreno: string | null } | null>(null)

/** Lo de tu cuerpo que da Progreso: perímetros, cómo estás y tu grasa (null hasta cargarlo). */
export const cuerpoProgreso = signal<CuerpoParaComida | null>(null)

/** Tu comida de cada día con su objetivo y su proteína (lo que miran los fines de semana y la proteína). */
const comidaConObjetivo = computed(() =>
  Object.entries(totales.value).map(([date, t]) => ({
    date,
    kcal: t.kcal,
    protein: t.protein,
    objetivo: objetivoDelDia(date)?.kcal ?? null,
  })),
)

/** Si estás en la fase final de la definición: la semana 9 o a 3 puntos de tu grasa objetivo. */
export const enFaseFinal = computed(() => {
  const a = ajustes.value
  if (a?.fase !== 'definicion') return false
  return (
    semanaDeLaFase(a.faseDesde ?? a.creado, hoy.value) >= SEMANA_FINAL ||
    grasaFinal(cuerpoProgreso.value?.grasa).final
  )
})

/** Lo que vería hoy la revisión semanal (en vivo: faltan datos, vas bien, pasos…). */
export const revisionDeHoy = computed<Revision | null>(() => {
  const a = ajustes.value
  if (!a) return null
  const c = cuerpoProgreso.value
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
    pesoKg: a.cuerpo.pesoKg,
    semanaFase: semanaDeLaFase(a.faseDesde ?? a.creado, hoy.value),
    porFases: a.porFases ?? false,
    ritmoAplicado: a.ritmoTramo ?? a.ritmo,
    situacion: a.situacion ?? null,
    mesetas: a.mesetas ?? 0,
    recarga: recargaActiva(a),
    animo: c?.sensaciones,
    medidas: c?.medidas,
    comida: comidaConObjetivo.value,
    gasto: a.gastoAprendido ?? calcularObjetivo(a).gasto,
    grasa: c?.grasa ?? null,
    mantenimiento: calcularObjetivo({ ...a, fase: 'mantenimiento' }).kcal,
    paron: deEntreno.value?.paron ?? false,
    cambioEntreno: deEntreno.value?.cambioEntreno ?? null,
  })
})

/** Tu rendimiento sesión a sesión y las sesiones de una vuelta de tu rutina (de Entreno; null hasta cargarlo). */
export const rendimientoComida = signal<{
  rendimiento: RendimientoReciente
  sesionesDelCiclo: number
} | null>(null)

/** Si hoy toca proponer una recarga de hidratos (y hasta cuándo duraría). null si no. */
export const recargaPropuesta = computed<{ hasta: string; sesiones: number } | null>(() => {
  const a = ajustes.value
  const r = rendimientoComida.value
  // Hasta saber tus días de entreno de verdad (llegan de Entreno al rato), no: con los estimados, la fecha de fin sale mal
  if (!a || !tiposEntreno.value || dieta.value || enRecarga(recargaActiva(a), hoy.value)) return null
  if (a.recargaDescartada && daysBetween(a.recargaDescartada, hoy.value) < 7) return null
  const animo = cuerpoProgreso.value?.sensaciones
  const toca = tocaRecarga({
    fase: a.fase,
    semanaFase: semanaDeLaFase(a.faseDesde ?? a.creado, hoy.value),
    rendimiento: r?.rendimiento ?? null,
    ultima: a.recarga ?? null,
    hoy: hoy.value,
    // También por cómo estás: 2 semanas seguidas con señales (la guía, § 7)
    semanasConSenales: animo ? semanasConSenales(animo, hoy.value, 2) : 0,
  })
  const sesiones = r?.sesionesDelCiclo ?? a.diasEntreno
  return toca ? { hasta: finDeRecarga(hoy.value, sesiones, (f) => tipoDe(f) === 'entreno'), sesiones } : null
})

/**
 * La recarga en curso, para tu día (usuario, 2026-11-22): hasta cuándo, si hoy entrenas y cuántos hidratos de más llevas
 * hoy. null si no estás en una.
 */
export const recargaDeHoy = computed<{ hasta: string; entrena: boolean; hidratos: number } | null>(() => {
  const a = ajustes.value
  const r = recargaActiva(a)
  if (!a || !r || !enRecarga(r, hoy.value)) return null
  const entrena = tipoDe(hoy.value) === 'entreno'
  const hidratos = entrena
    ? objetivoDe(a, hoy.value).carbs - objetivoDe({ ...a, recarga: null }, hoy.value).carbs
    : 0
  return { hasta: r.hasta, entrena, hidratos }
})

/** Consejos que acompañan a la revisión de esta semana (si la grasa no baja, cómo estás, proteína, perímetros…). */
export const consejosSemana = computed<string[]>(() => {
  const a = ajustes.value
  const r = revisionDeHoy.value
  if (!a || !r || dieta.value) return []
  const c = cuerpoProgreso.value
  const lento = r.tipo === 'pasos' || (r.tipo === 'cambio' && r.lento && !r.motivo)
  return consejosDeLaSemana({
    fase: a.fase,
    lento,
    hoy: hoy.value,
    fuerza: fuerzaBasicos.value,
    final: enFaseFinal.value,
    animo: c?.sensaciones,
    medidas: c?.medidas,
    proteina: proteinaPorKilo(comidaConObjetivo.value, hoy.value, a.cuerpo.pesoKg),
    subirKcal: a.fase === 'volumen' && ((r.tipo === 'cambio' && r.a > r.de) || r.tipo === 'progresas'),
    onOff: Boolean(a.onOff),
    paron: a.fase === 'mantenimiento' && a.situacion === 'paron',
  })
})
