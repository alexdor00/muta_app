// Punto de entrada de la plataforma. Para la versión Capacitor se cambia solo esta línea.
export { webPlatform as platform } from './web.ts'
export { feedback, FEEDBACK, type FeedbackPrefs, type Moment } from './feedback.ts'
export type { Haptic, Platform, Sound } from './platform.ts'
