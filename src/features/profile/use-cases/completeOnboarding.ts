import { getDb } from '../../../shared/data/db.ts'
import { buildProfile } from '../domain/onboarding.ts'
import { onboardingAnswers } from '../state/onboarding.ts'

/** Guarda el perfil con las respuestas de la bienvenida. */
export async function completeOnboarding(): Promise<void> {
  const profile = buildProfile(onboardingAnswers.value)
  const db = await getDb()
  await db.put('profile', profile)
}
