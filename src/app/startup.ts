import { getDb } from '../shared/data/db.ts'
import { saveError } from '../shared/data/errorLog.ts'
import { requestPersistentStorage } from '../shared/data/persist.ts'
import { seedPrograms } from '../shared/data/programs.ts'
import { logError, onError } from '../shared/lib/logger.ts'
import { registerUpdates } from './updates.ts'

/** Arranque: abre la base de datos, guarda los errores en ella y pide que el navegador no borre nada. */
export async function startup(): Promise<void> {
  window.addEventListener('error', (event) => logError(event.error ?? event.message, 'ventana'))
  window.addEventListener('unhandledrejection', (event) => logError(event.reason, 'promesa'))

  try {
    const db = await getDb()
    onError((entry) => void saveError(db, entry))
    const added = await seedPrograms(db)
    if (added) console.info(`Programas cargados en la base de datos: ${added}`)
  } catch (error) {
    logError(error, 'abrir base de datos')
  }

  registerUpdates()

  try {
    await requestPersistentStorage()
  } catch (error) {
    logError(error, 'almacenamiento persistente')
  }
}
