// Lo que Entreno necesita de Nutrición (por el index.ts del área; usuario, 2026-11-23: «que hagan equipo»): tu fase, si
// estás al final de la definición, la recarga, cuándo cambiaron tus kcal, lo que falla en tu comida con su cifra y cómo
// estás (las mismas señales y reglas que la revisión semanal). No guarda nada.
import { addDays, daysBetween } from '../../../shared/lib/format.ts'
import {
  comidaParaEntreno,
  FUERZA_BAJA,
  NOMBRE_SENAL,
  parteDelGasto,
  proteinaPorKilo,
  senalesDeLaSemana,
} from '../domain/senales.ts'
import { calcularObjetivo } from '../domain/targets.ts'
import { ritmoSemanal } from '../domain/weight.ts'
import { ajustes, recargaActiva, serie, totales } from '../state/comida.ts'
import { cuerpoProgreso, enFaseFinal, fuerzaBasicos, recargaPropuesta } from '../state/entrenador.ts'
import { cargarComida, cargarCuerpo, cargarFuerza } from './nutritionStore.ts'

/** Lo que da Nutrición al entrenador de Entreno (el tipo lo repite Entreno en su dominio: `DeNutricion`). */
export type NutricionParaEntreno = {
  fase: 'definicion' | 'mantenimiento' | 'volumen'
  finDefinicion: boolean
  pausaHasta: string | null
  recargaPropuesta: boolean
  cambioKcal: string | null
  comida: string | null
  fuerzaBaja: boolean
  recuperacion: string[]
}

/** Tras una recarga, los días en los que tu rendimiento aún lleva sus hidratos (sugerido: una semana). */
const DIAS_RENDIMIENTO_TRAS_RECARGA = 7

/** null sin objetivo de comida. */
export async function nutricionParaEntreno(fecha: string): Promise<NutricionParaEntreno | null> {
  await cargarComida()
  await Promise.all([cargarCuerpo(), cargarFuerza()])
  const a = ajustes.value
  if (!a) return null
  const r = recargaActiva(a)
  const finPausa = r ? addDays(r.hasta, DIAS_RENDIMIENTO_TRAS_RECARGA) : null
  const dias = Object.entries(totales.value).map(([date, t]) => ({ date, kcal: t.kcal, protein: t.protein }))
  const animo = cuerpoProgreso.value?.sensaciones
  const f = fuerzaBasicos.value
  // Una sugerencia de kcal aplicada vale desde mañana: `desde` es ese día
  const cambioKcal =
    a.kcalAnterior !== null && daysBetween(addDays(a.desde, -1), fecha) < 7 ? addDays(a.desde, -1) : null
  return {
    fase: a.fase,
    finDefinicion: enFaseFinal.value,
    pausaHasta: r && finPausa && fecha >= r.desde && fecha <= finPausa ? finPausa : null,
    recargaPropuesta: recargaPropuesta.value !== null,
    cambioKcal,
    comida: comidaParaEntreno({
      fase: a.fase,
      proteina: proteinaPorKilo(dias, fecha, a.cuerpo.pesoKg),
      pct: ritmoSemanal(serie.value, fecha)?.pctSemana ?? null,
      parte: parteDelGasto(dias, fecha, a.gastoAprendido ?? calcularObjetivo(a).gasto),
    }),
    fuerzaBaja: f !== null && f <= FUERZA_BAJA,
    recuperacion: animo ? senalesDeLaSemana(animo, fecha).map((s) => NOMBRE_SENAL[s]) : [],
  }
}

/**
 * Cuánto cambió tu peso (de tendencia) en un tramo, en kg con un decimal: el primer pesaje desde `desde` frente al último
 * hasta `hasta` (para «Rutina terminada» en Entreno: usuario, 2026-11-24). null sin dos pesajes.
 */
export async function cambioDePeso(desde: string, hasta: string): Promise<number | null> {
  await cargarComida()
  const dentro = serie.value.filter((p) => p.date >= desde && p.date <= hasta)
  const [a, b] = [dentro[0], dentro.at(-1)]
  return a && b && a !== b ? Math.round((b.tendencia - a.tendencia) * 10) / 10 : null
}
