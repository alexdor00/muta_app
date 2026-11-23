// Lo que Progreso necesita de Comida (por el index.ts del área): tus pesajes con su tendencia y su ritmo frente al
// previsto de tu fase, lo que comiste cada día frente a tu objetivo, la cintura de tus consultas y tu sexo y tu altura (la composición corporal). Lee con cargarComida(); no
// guarda nada.
import { ritmoPrevisto } from '../domain/review.ts'
import type { Fase } from '../domain/targets.ts'
import { ritmoSemanal, type PuntoPeso, type Ritmo } from '../domain/weight.ts'
import { addDays } from '../../../shared/lib/format.ts'
import {
  ajustes,
  enRecarga,
  hoy,
  objetivoDelDia,
  recargaActiva,
  serie,
  tipoDe,
  totales,
} from '../state/comida.ts'
import { proximaConsulta, revisiones, ultimaConsulta } from '../state/dieta.ts'
import { cargarComida, cargarTipos } from './nutritionStore.ts'

export type ComidaParaProgreso = {
  /** Todos tus pesajes con su tendencia, del más antiguo al último. */
  serie: PuntoPeso[]
  /** Tu ritmo de las 2 últimas semanas (null con pocos pesajes). */
  ritmo: Ritmo | null
  /** Tu fase y el ritmo previsto para ella (% del peso por semana); null sin objetivo. */
  fase: Fase | null
  previsto: { centro: number; min: number; max: number } | null
  /** Lo que comiste cada día que apuntaste (kcal y proteína) y tu objetivo de ese día (null sin objetivo). */
  dias: { date: string; kcal: number; protein: number; objetivo: number | null }[]
  /** La cintura de tus consultas (cm). */
  cinturas: { date: string; cm: number }[]
  /** Tu sexo y tu altura (los de «Tus datos»); null sin objetivo. */
  cuerpo: { sexo: 'hombre' | 'mujer'; alturaCm: number } | null
  /** La consulta semanal (va con una dieta): la última y cuándo toca; null sin dieta. */
  consulta: { ultima: string | null; proxima: string } | null
  /** Los días de tu recarga de hidratos en que subió tu objetivo (usuario, 2026-11-22: una «R» en el calendario). */
  recarga: string[]
}

export async function comidaParaProgreso(): Promise<ComidaParaProgreso> {
  await cargarComida()
  // Con hidratos según el día, el objetivo de cada día depende de si entrenas: hace falta tu rutina
  await cargarTipos()
  const a = ajustes.value
  const consultas = [...revisiones.value].sort((x, y) => x.fecha.localeCompare(y.fecha))
  return {
    serie: serie.value,
    ritmo: ritmoSemanal(serie.value, hoy.value),
    fase: a?.fase ?? null,
    // El de la etapa en que vas, si sigues la velocidad por fases (como la revisión semanal)
    previsto: a ? ritmoPrevisto(a.fase, a.ritmoTramo ?? a.ritmo) : null,
    dias: Object.entries(totales.value)
      .filter(([, t]) => t.kcal > 0)
      .map(([date, t]) => ({
        date,
        kcal: t.kcal,
        protein: t.protein,
        objetivo: objetivoDelDia(date)?.kcal ?? null,
      }))
      .sort((x, y) => x.date.localeCompare(y.date)),
    cinturas: consultas.flatMap((r) => (r.cintura ? [{ date: r.fecha, cm: r.cintura }] : [])),
    cuerpo: a ? { sexo: a.cuerpo.sexo, alturaCm: a.cuerpo.alturaCm } : null,
    recarga: diasDeRecarga(),
    consulta: proximaConsulta.value
      ? { ultima: ultimaConsulta.value?.fecha ?? null, proxima: proximaConsulta.value }
      : null,
  }
}

/** Los días de tu última recarga que fueron de entreno (los de descanso siguieron en definición). */
function diasDeRecarga(): string[] {
  const r = recargaActiva()
  if (!r) return []
  const dias: string[] = []
  for (let f = r.desde; f <= r.hasta; f = addDays(f, 1))
    if (enRecarga(r, f) && tipoDe(f) === 'entreno') dias.push(f)
  return dias
}
