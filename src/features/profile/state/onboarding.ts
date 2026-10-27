import { signal } from '@preact/signals'
import {
  clampDays,
  daysFor,
  DEFAULT_ANSWERS,
  GOALS,
  LEVELS,
  type Goal,
  type OnboardingAnswers,
} from '../domain/onboarding.ts'

/** Respuestas mientras se recorre la bienvenida. Se guardan al terminar. */
export const onboardingAnswers = signal<OnboardingAnswers>(DEFAULT_ANSWERS)

export function answer(changes: Partial<OnboardingAnswers>): void {
  onboardingAnswers.value = clampDays({ ...onboardingAnswers.value, ...changes })
}

// Opciones que enseñan las pantallas (salen del dominio; las pantallas no lo usan directamente).
export const goalOptions = GOALS
export const levelOptions = LEVELS
export const daysOptionsFor = daysFor
export type { Goal }
