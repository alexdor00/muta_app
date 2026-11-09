// El entrenador de Entreno en Tu plan: los consejos de esta semana (los últimos 7 días) que aún no has aplicado ni dejado
// para otra vez. El cálculo, en domain/coach/revision.ts.
import { computed, signal } from '@preact/signals'
import { addDays, localDate } from '../../../shared/lib/format.ts'
import {
  lunesDe,
  mejoraPorMusculo,
  revisionEntrenador,
  type ConsejoEntrenador,
} from '../domain/coach/revision.ts'
import { faseActual } from './fase.ts'
import { entrenos, tuPlan } from './plan.ts'

export type { ConsejoEntrenador } from '../domain/coach/revision.ts'

/** Lo ya visto (aplicado o «Ahora no»): `músculo|lunes|lectura`. Se guarda en `userContent` (use-cases/entrenador.ts). */
export const vistosEntrenador = signal<string[]>([])

/** La marca de un consejo: vale para esa semana y esa lectura (si la semana que viene vuelve a tocar, vuelve a salir). */
export const marcaDe = (c: ConsejoEntrenador, hoy = localDate()) =>
  `${c.musculo}|${lunesDe(hoy)}|${c.lectura}`

export const consejosEntrenador = computed<ConsejoEntrenador[]>(() => {
  const plan = tuPlan.value
  if (plan.status !== 'ready') return []
  const hoy = localDate()
  const vistos = new Set(vistosEntrenador.value)
  return revisionEntrenador({
    mejora: mejoraPorMusculo(entrenos.value, addDays(hoy, -6)),
    semana: plan.semana,
    definicion: faseActual.value === 'cut',
  }).filter((c) => !vistos.has(marcaDe(c, hoy)))
})
