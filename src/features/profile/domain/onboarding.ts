// Respuestas de la bienvenida (A03 objetivo, A04 nivel y días) y el perfil que generan.

export type Goal = 'gain_muscle' | 'lose_fat' | 'feel_better'
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Equipment = 'gym_full' | 'gym_basic' | 'home'

export const GOALS: { id: Goal; title: string; detail: string }[] = [
  { id: 'gain_muscle', title: 'Ganar músculo', detail: 'Más fuerza, más volumen' },
  { id: 'lose_fat', title: 'Perder grasa', detail: 'Más definición, menos peso' },
  { id: 'feel_better', title: 'Sentirte mejor', detail: 'Más energía, mejor salud' },
]

/** Fase de alimentación y entreno que marca cada objetivo. */
export type Phase = 'bulk' | 'cut' | 'maintenance'

/**
 * Ganar músculo → volumen (superávit pequeño), perder grasa → definición (déficit),
 * sentirte mejor → mantenimiento (comer lo que gastas).
 */
const PHASE_BY_GOAL: Record<Goal, Phase> = {
  gain_muscle: 'bulk',
  lose_fat: 'cut',
  feel_better: 'maintenance',
}

export function phaseOf(goal: Goal): Phase {
  return PHASE_BY_GOAL[goal]
}

export const PHASE_LABELS: Record<Phase, string> = {
  bulk: 'Volumen',
  cut: 'Definición',
  maintenance: 'Mantenimiento',
}

export const LEVELS: { id: Level; label: string }[] = [
  { id: 'beginner', label: 'Principiante' },
  { id: 'intermediate', label: 'Intermedio' },
  { id: 'advanced', label: 'Avanzado' },
]

export const DAYS_OPTIONS = [2, 3, 4, 5, 6] as const

export type OnboardingAnswers = { goal: Goal; level: Level; daysPerWeek: number }

/** Lo que sale marcado en el diseño al entrar. */
export const DEFAULT_ANSWERS: OnboardingAnswers = { goal: 'gain_muscle', level: 'beginner', daysPerWeek: 3 }

export const ONBOARDING_STEPS = 2

export type Profile = OnboardingAnswers & {
  id: 'me'
  /** La bienvenida no lo pregunta todavía. */
  equipment: Equipment
  createdAt: string
  updatedAt: string
  deletedAt: null
}

export function isValidAnswers(answers: OnboardingAnswers): boolean {
  return (
    GOALS.some((goal) => goal.id === answers.goal) &&
    LEVELS.some((level) => level.id === answers.level) &&
    (DAYS_OPTIONS as readonly number[]).includes(answers.daysPerWeek)
  )
}

export function buildProfile(answers: OnboardingAnswers, now = new Date()): Profile {
  if (!isValidAnswers(answers)) throw new Error('Respuestas de la bienvenida no válidas')
  const at = now.toISOString()
  return { id: 'me', ...answers, equipment: 'gym_full', createdAt: at, updatedAt: at, deletedAt: null }
}
