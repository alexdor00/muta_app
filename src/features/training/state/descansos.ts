// Tus descansos revisados al terminar una sesión (usuario, 2026-11-23): la regla, en domain/descansoTrasSesion.ts; aquí,
// con el entreno de hoy y tu plan. Se proponen en el resumen; «Aplicar» cambia el descanso de ese ejercicio
// (`elegirDescanso`, el mismo que ⏱ en la sesión) para las próximas veces.
import { signal } from '@preact/signals'
import { descansoTrasSesion, type PropuestaDescanso } from '../domain/descansoTrasSesion.ts'
import { DEFAULT_MINUTES } from '../domain/priorities.ts'
import type { Entreno } from '../domain/workoutHistory.ts'
import { rangoDe, type SesionPlan } from '../domain/workoutPlan.ts'
import { descansoDe } from './sesionEnCurso.ts'

/** Lo que ya decidiste en este resumen: aplicado o «Ahora no» (en memoria: se ve hasta que sales). */
export const descansosVistos = signal<Record<string, 'aplicado' | 'no'>>({})

/** Las propuestas de descanso de un entreno recién hecho (tu tiempo máximo: 75 min, el de 02-reglas § 4). */
export function descansosPropuestos(
  entreno: Entreno,
  sesion: SesionPlan | null,
  minutos: number,
): PropuestaDescanso[] {
  if (!sesion) return []
  const larga = minutos > DEFAULT_MINUTES
  return entreno.ejercicios.flatMap((x) => {
    const e = sesion.ejercicios.find((y) => y.nombre === x.nombre)
    if (!e) return []
    const p = descansoTrasSesion({
      nombre: x.nombre,
      series: x.series,
      descanso: descansoDe(e),
      descansoPlan: e.descanso,
      compuesto: e.compuesto,
      repsMax: rangoDe(e.reps)?.[1] ?? null,
      larga,
    })
    return p ? [p] : []
  })
}
