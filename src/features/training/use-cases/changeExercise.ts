import { anadir, claveDe, pautaDe, quitar } from '../domain/routineEdit.ts'
import type { EjercicioPlan } from '../domain/workoutPlan.ts'
import { sesiones } from '../state/plan.ts'
import { descansoDe } from '../state/sesionEnCurso.ts'
import { idPorNombre } from './exerciseLibrary.ts'
import { cambiarEnPlan, editarSesion } from './training.ts'

/**
 * Cambia un ejercicio de una sesión de tu plan por otro, para las próximas veces (Editar rutina y el «···» de la ficha).
 * Uno de la rutina se cambia en `cambios` (y elegir el de la rutina lo deja como estaba); uno que añadiste tú se sustituye
 * con su pauta de ahora.
 */
export function cambiarEjercicioDelPlan(
  sigla: string,
  ejercicios: readonly EjercicioPlan[],
  e: EjercicioPlan,
  nuevo: string,
): void {
  if (!e.anadido) {
    void cambiarEnPlan(claveDe(e), nuevo === claveDe(e) ? null : nuevo)
    return
  }
  const nombres = ejercicios.map((x) => x.nombre)
  const pauta = { series: e.series, reps: pautaDe(e).reps, rir: e.rir, descanso: descansoDe(e) }
  void editarSesion(sigla, (ed) => anadir(quitar(ed, e.nombre), { ...pauta, nombre: nuevo }, nombres))
}

/** Dónde está un ejercicio de la biblioteca en tu plan: la primera sesión que lo lleva, o null. */
export function enTuPlan(
  id: string,
): { sigla: string; ejercicios: EjercicioPlan[]; e: EjercicioPlan } | null {
  for (const s of sesiones.value) {
    const e = s.ejercicios.find((x) => idPorNombre(x.nombre) === id)
    if (e) return { sigla: s.sigla, ejercicios: s.ejercicios, e }
  }
  return null
}
