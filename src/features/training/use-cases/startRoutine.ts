import { logError } from '../../../shared/lib/logger.ts'
import { routineDetail } from '../state/routines.ts'
import { chooseRoutine } from './chooseRoutine.ts'

/** Empieza la rutina que está abierta, con lo que hayas elegido en ella. Devuelve si se guardó. */
export async function startOpenRoutine(): Promise<boolean> {
  const state = routineDetail.value
  if (state.status !== 'ready') return false
  try {
    await chooseRoutine(state.item.entry.id, {
      weakPoints: state.weak?.choice ?? null,
      priorities: state.choice,
    })
    return true
  } catch (error) {
    logError(error, 'empezar rutina')
    return false
  }
}
