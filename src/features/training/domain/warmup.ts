// Series de calentamiento (aproximación), como en el prototipo anterior (calentamiento.js): la primera vez que un músculo
// trabaja en la sesión, antes de sus series efectivas, una rampa con los kilos calculados desde el peso de trabajo.
// Lo que ya trabajó (como principal o secundario) en un ejercicio anterior no repite. No cuenta como volumen ni récord.
import type { MuscleId } from './muscles.ts'

/** Músculos que piden más aproximación (calentamiento.js · WARM_BIG). */
const GRANDES: ReadonlySet<MuscleId> = new Set([
  'pecho',
  'dorsal',
  'espalda_alta',
  'cuadriceps',
  'femoral',
  'gluteo',
  'hombro_ant',
  'hombro_lat',
])

export type EjercicioACalentar = {
  /** Músculo principal. */
  musculo: MuscleId
  /** Los que trabajan bastante sin ser el principal: cuentan como ya calentados. */
  secundarios: readonly MuscleId[]
  /** Básico (varias articulaciones) o aislamiento. */
  compuesto: boolean
  pesoCorporal: boolean
  /** Peso de trabajo de la primera serie; null si no se sabe. */
  kilos: number | null
  /** Salto de peso del ejercicio (2,5 kg en barra; 2 kg en mancuernas…). */
  salto: number
}

export type SerieCalentamiento = { kilos: number; reps: number }

/** Rampa (tanto por uno del peso de trabajo × reps) según el ejercicio; null si no se calienta (peso corporal). */
export function rampa(e: EjercicioACalentar): [number, number][] | null {
  if (e.pesoCorporal) return null
  const grande = GRANDES.has(e.musculo)
  if (e.compuesto && grande) {
    return e.kilos !== null && e.kilos >= 30
      ? [
          [0.5, 8],
          [0.7, 5],
          [0.85, 3],
        ]
      : [
          [0.5, 10],
          [0.75, 5],
        ]
  }
  if (grande || e.compuesto) {
    return [
      [0.5, 10],
      [0.75, 5],
    ]
  }
  return [[0.6, 10]]
}

/**
 * El calentamiento de cada ejercicio de la sesión, en orden: solo el primero que trabaja cada músculo. Los kilos se
 * redondean hacia abajo al salto del ejercicio; se quitan los que salen 0, repetidos o iguales al peso de trabajo.
 */
export function planCalentamiento(
  ejercicios: readonly EjercicioACalentar[],
): (SerieCalentamiento[] | null)[] {
  const calentados = new Set<MuscleId>()
  return ejercicios.map((e) => {
    const primero = !calentados.has(e.musculo)
    calentados.add(e.musculo)
    for (const m of e.secundarios) calentados.add(m)
    const pasos = primero ? rampa(e) : null
    if (!pasos || e.kilos === null) return null
    const series: SerieCalentamiento[] = []
    for (const [parte, reps] of pasos) {
      const kilos = Math.floor((e.kilos * parte) / e.salto + 1e-9) * e.salto
      if (kilos <= 0 || kilos >= e.kilos || series.some((s) => s.kilos === kilos)) continue
      series.push({ kilos: Math.round(kilos * 100) / 100, reps })
    }
    return series.length ? series : null
  })
}
