// El entrenador de Entreno en Tu plan: los consejos de esta semana que aún no has aplicado ni dejado para otra vez. El
// cálculo, en domain/coach/revision.ts; aquí, con tus entrenos, tu plan, tus músculos y tu fase.
import { computed, signal } from '@preact/signals'
import { addDays, localDate } from '../../../shared/lib/format.ts'
import {
  lunesDe,
  mejoraPorMusculo,
  revisionEntrenador,
  type ConsejoEntrenador,
  type Semanas,
} from '../domain/coach/revision.ts'
import type { MuscleId, Range } from '../domain/muscles.ts'
import { rangoDe } from '../domain/workoutPlan.ts'
import { faseActual } from './fase.ts'
import { elecciones } from './musculos.ts'
import { entrenos, tuPlan } from './plan.ts'

export type { ConsejoEntrenador } from '../domain/coach/revision.ts'

/**
 * Lo ya visto: `músculo|lunes|lectura` (aplicado o «Ahora no») y `músculo|lunes|aplicado` (para esperar una semana a ver
 * el efecto). Se guarda en `userContent` (use-cases/entrenador.ts).
 */
export const vistosEntrenador = signal<string[]>([])

/** La marca de un consejo: vale para esa semana y esa lectura (si la semana que viene vuelve a tocar, vuelve a salir). */
export const marcaDe = (c: Pick<ConsejoEntrenador, 'musculo' | 'lectura'>, hoy = localDate()) =>
  `${c.musculo}|${lunesDe(hoy)}|${c.lectura}`
export const marcaAplicado = (musculo: MuscleId, hoy = localDate()) => `${musculo}|${lunesDe(hoy)}|aplicado`

export const consejosEntrenador = computed<ConsejoEntrenador[]>(() => {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return []
  const hoy = localDate()
  const rangos: Record<string, Range> = {}
  for (const s of plan.semana)
    for (const e of s.ejercicios) {
      const r = rangoDe(e.reps)
      if (r) rangos[e.nombre] = r
    }
  // Tres semanas de 7 días hacia atrás: la de ahora, la anterior y la de antes
  const semana = (n: number) =>
    mejoraPorMusculo(entrenos.value, addDays(hoy, -7 * n - 6), addDays(hoy, -7 * n), rangos)
  const [s0, s1, s2] = [semana(0), semana(1), semana(2)]
  const semanas: Partial<Record<MuscleId, Semanas>> = {}
  for (const m of Object.keys(s0) as MuscleId[]) semanas[m] = [s0[m], s1[m], s2[m]]
  const vistos = new Set(vistosEntrenador.value)
  const pasada = addDays(hoy, -7)
  const aplicadoHace = new Set(
    (Object.keys(s0) as MuscleId[]).filter((m) => vistos.has(marcaAplicado(m, pasada))),
  )
  const modos = Object.fromEntries(Object.entries(elecciones.value).map(([m, e]) => [m, e?.modo]))
  return revisionEntrenador({
    semanas,
    semana: plan.semana,
    fase: faseActual.value === 'cut' ? 'definicion' : faseActual.value === 'bulk' ? 'volumen' : 'otra',
    modos,
    aplicadoHace,
  }).filter((c) => !vistos.has(marcaDe(c, hoy)))
})
