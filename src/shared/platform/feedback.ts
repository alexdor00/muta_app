import type { Haptic, Platform, Sound } from './platform.ts'

/** Momentos de la tabla «Respuesta al tacto y sonido» del documento de rediseño. */
export type Moment =
  | 'setLogged'
  | 'betterThanLast'
  | 'record'
  | 'restEnd'
  | 'inputError'
  /** 15 s antes de acabar el descanso: prepárate (guía de culturismo natural, «mentalízate 15 s antes de cada serie»). */
  | 'restSoon'

export const FEEDBACK: Record<Moment, { haptic: Haptic; sound: Sound | null }> = {
  setLogged: { haptic: 'light', sound: 'click' },
  betterThanLast: { haptic: 'medium', sound: 'twoNotes' },
  record: { haptic: 'success', sound: 'risingThree' },
  restEnd: { haptic: 'warning', sound: 'threeBeeps' },
  inputError: { haptic: 'error', sound: null },
  restSoon: { haptic: 'light', sound: null },
}

export type FeedbackPrefs = { sound: boolean; vibration: boolean }

/** Vibra y suena según el momento, respetando las preferencias del perfil. */
export function feedback(platform: Platform, moment: Moment, prefs: FeedbackPrefs): void {
  const { haptic, sound } = FEEDBACK[moment]
  if (prefs.vibration) platform.haptic(haptic)
  if (prefs.sound && sound) platform.sound(sound)
}
