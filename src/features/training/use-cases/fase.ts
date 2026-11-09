import { getDb } from '../../../shared/data/db.ts'
import { logError } from '../../../shared/lib/logger.ts'
import { phaseOf, type Goal, type Phase } from '../../profile/index.ts'
import { faseActual } from '../state/fase.ts'

/** Cómo guarda Nutrición su fase (`userContent`, id «nutricion»): solo se lee el campo `fase`. */
const DE_NUTRICION: Record<string, Phase> = {
  definicion: 'cut',
  volumen: 'bulk',
  mantenimiento: 'maintenance',
}

/** Lee tu fase: la de tu objetivo de Nutrición o, si aún no lo tienes, la de tu bienvenida. */
export async function cargarFase(): Promise<void> {
  try {
    const db = await getDb()
    const ajustes = (await db.get('userContent', 'nutricion')) as { fase?: string } | undefined
    const perfil = (await db.get('profile', 'me')) as { goal?: Goal } | undefined
    faseActual.value =
      (ajustes?.fase && DE_NUTRICION[ajustes.fase]) || (perfil?.goal ? phaseOf(perfil.goal) : null)
  } catch (error) {
    logError(error, 'leer tu fase')
  }
}
