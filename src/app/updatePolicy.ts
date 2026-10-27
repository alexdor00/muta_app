// Regla 10: las actualizaciones se aplican al abrir la app o al tocar «Actualizar», nunca durante un entreno.

export type UpdateMoment = 'open' | 'userTapped' | 'whileUsing'

export function shouldApplyUpdate(moment: UpdateMoment, workoutInProgress: boolean): boolean {
  if (workoutInProgress) return false
  return moment === 'open' || moment === 'userTapped'
}
