// Lo que Comida necesita de Entreno (por el index.ts del área): qué días son de entreno según tu rutina, cómo va tu fuerza
// en los básicos y tu rendimiento sesión a sesión (para la recarga de hidratos). Lee tu plan con cargarPlan(); no guarda nada.
import { rendimientoReciente, type Rendimiento } from '../domain/rendimiento.ts'
import { fuerzaEnBasicos, type FuerzaBasicos } from '../domain/strengthTrend.ts'
import { diasPrevistos, entrenos, tuPlan } from '../state/plan.ts'
import { porNombre } from './exerciseLibrary.ts'
import { cargarPlan } from './training.ts'

/**
 * `n` días desde `inicio`: «entreno» si entrenaste o te toca una sesión, «descanso» si no. null si no tienes rutina (Comida
 * reparte entonces tus días de entreno por la semana).
 */
export async function tiposDeDia(
  hoy: string,
  inicio: string,
  n: number,
): Promise<Record<string, 'entreno' | 'descanso'> | null> {
  await cargarPlan()
  if (tuPlan.value.status !== 'ready') return null
  return Object.fromEntries(
    diasPrevistos(hoy, inicio, n).map((d) => [d.fecha, d.estado === 'descanso' ? 'descanso' : 'entreno']),
  )
}

/** Cómo va tu fuerza en los 3 compuestos que más repites (null sin datos de 4 semanas). */
export async function fuerzaParaComida(hoy: string): Promise<FuerzaBasicos | null> {
  await cargarPlan()
  return fuerzaEnBasicos(entrenos.value, hoy, (nombre) => porNombre(nombre)?.kind === 'compound')
}

/**
 * Para la recarga de hidratos: tu rendimiento de los últimos 10 días frente a las semanas de antes, y cuántas sesiones
 * tiene una vuelta de tu rutina (lo que dura la recarga). null sin rutina.
 */
export async function rendimientoParaComida(
  hoy: string,
): Promise<{ rendimiento: Rendimiento; sesionesDelCiclo: number } | null> {
  await cargarPlan()
  const plan = tuPlan.value
  if (plan.status !== 'ready') return null
  return { rendimiento: rendimientoReciente(entrenos.value, hoy), sesionesDelCiclo: plan.semana.length }
}
