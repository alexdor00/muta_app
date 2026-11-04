// Los descansos obligatorios de tu plan: tras qué sesiones van (los de la rutina o los que cambiaste en Editar rutina) y si
// hoy toca descansar. El plan va por rotación, sin días fijos: un descanso cuenta desde el día siguiente al último entreno.
import type { MuscleId } from './muscles.ts'
import { isSession, type Day, type RestRule } from './program.ts'
import { restPositions } from './restCycles.ts'

/**
 * Tras qué sesiones de la semana va un descanso (1 = tras la primera; repetido, dos días). Si el archivo trae días de
 * descanso, los suyos (uno al principio cuenta al final); si no, los que dice el documento para esa fase (`rules`) o, si no
 * dice nada, donde se completa la vuelta al cuerpo (`restPositions`), como en el detalle de la rutina.
 */
export function descansosDeRutina(
  dias: readonly Day[],
  musculos: MuscleId[][],
  rules: readonly RestRule[] = [],
  fase = 0,
): number[] {
  const total = dias.filter(isSession).length
  if (dias.some((d) => !isSession(d))) {
    let hechas = 0
    const tras: number[] = []
    for (const d of dias) {
      if (isSession(d)) hechas += 1
      else tras.push(hechas || total)
    }
    return tras.sort((a, b) => a - b)
  }
  const mias = rules.filter((r) => r.phase === undefined || r.phase === fase)
  if (mias.length) return mias.map((r) => r.after).sort((a, b) => a - b)
  return restPositions(musculos)
}

/** Cuántos descansos van tras cada sesión (de 1 a `sesiones`), para editarlos. */
export function descansosPorSesion(tras: readonly number[], sesiones: number): number[] {
  return Array.from({ length: sesiones }, (_, i) => tras.filter((t) => t === i + 1).length)
}

/** Al revés: de cuántos van tras cada sesión a la lista de «tras qué sesión». */
export function trasDe(porSesion: readonly number[]): number[] {
  return porSesion.flatMap((n, i) => Array.from({ length: n }, () => i + 1))
}

/**
 * ¿Hoy toca descanso? Si la última sesión hecha (su número en la semana) lleva `n` descansos detrás y desde su día han
 * pasado entre 1 y `n` días. Sin entrenos, o si ya entrenaste hoy, no.
 */
export function hoyTocaDescanso(
  tras: readonly number[],
  ultimaHecha: number | null,
  diasDesdeUltimo: number | null,
): boolean {
  if (ultimaHecha === null || diasDesdeUltimo === null || diasDesdeUltimo < 1) return false
  return diasDesdeUltimo <= tras.filter((t) => t === ultimaHecha).length
}

/**
 * Días de descanso que aún se deben antes de la siguiente sesión, contando desde el primer día sin entrenar: si entrenaste
 * hoy (0 días desde el último), todos los de la sesión hecha; si fue antes, los que queden de ellos (hoy incluido).
 */
export function descansosPendientes(
  tras: readonly number[],
  ultimaHecha: number | null,
  diasDesdeUltimo: number | null,
): number {
  if (ultimaHecha === null || diasDesdeUltimo === null) return 0
  const deEsa = tras.filter((t) => t === ultimaHecha).length
  return Math.max(0, deEsa - Math.max(0, diasDesdeUltimo - 1))
}
