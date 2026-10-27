import { signal } from '@preact/signals'
import { registerSW } from 'virtual:pwa-register'
import { getDb } from '../shared/data/db.ts'
import { WORKOUT_STATUS } from '../shared/data/schema.ts'
import { logError } from '../shared/lib/logger.ts'
import { shouldApplyUpdate, type UpdateMoment } from './updatePolicy.ts'

/** Hay una versión nueva esperando (para el botón «Actualizar» de Perfil). */
export const updateAvailable = signal(false)

let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null

async function workoutInProgress(): Promise<boolean> {
  const db = await getDb()
  return (await db.countFromIndex('workouts', 'status', WORKOUT_STATUS.inProgress)) > 0
}

async function tryApply(moment: UpdateMoment): Promise<boolean> {
  if (!applyUpdate || !shouldApplyUpdate(moment, await workoutInProgress())) return false
  await applyUpdate(true)
  return true
}

/** Lo llama el botón «Actualizar». Devuelve false si hay un entreno en curso. */
export function updateNow(): Promise<boolean> {
  return tryApply('userTapped')
}

/** Registra el service worker: la app queda guardada en el móvil y funciona sin internet. */
export function registerUpdates(): void {
  if (!('serviceWorker' in navigator)) return
  applyUpdate = registerSW({
    onRegisteredSW(_url, registration) {
      // Al abrir la app: si ya había una versión nueva esperando, se aplica ahora.
      if (registration?.waiting) {
        updateAvailable.value = true
        tryApply('open').catch((error) => logError(error, 'actualizar al abrir'))
      }
    },
    onNeedRefresh() {
      // Llega mientras se usa la app: solo se avisa.
      updateAvailable.value = true
    },
    onRegisterError(error) {
      logError(error, 'registrar service worker')
    },
  })
}
