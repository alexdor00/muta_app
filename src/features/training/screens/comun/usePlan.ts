import { useEffect } from 'preact/hooks'
import { tuPlan } from '../../state/plan.ts'
import { cargarPlan } from '../../use-cases/training.ts'

/** Tu plan para una pantalla: lo carga la primera vez y repinta cuando cambia. */
export function usePlan() {
  useEffect(() => {
    void cargarPlan()
  }, [])
  return tuPlan.value
}
