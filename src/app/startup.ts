import { getDb } from '../shared/data/db.ts'
import { saveError } from '../shared/data/errorLog.ts'
import { requestPersistentStorage } from '../shared/data/persist.ts'
import { logError, onError } from '../shared/lib/logger.ts'

/** Arranque: abre la base de datos, guarda los errores en ella y pide que el navegador no borre nada. */
export async function startup(): Promise<void> {
  window.addEventListener('error', (event) => logError(event.error ?? event.message, 'ventana'))
  window.addEventListener('unhandledrejection', (event) => logError(event.reason, 'promesa'))

  try {
    const db = await getDb()
    onError((entry) => void saveError(db, entry))
  } catch (error) {
    logError(error, 'abrir base de datos')
  }

  try {
    await requestPersistentStorage()
  } catch (error) {
    logError(error, 'almacenamiento persistente')
  }
}
