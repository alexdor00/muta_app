import type { JSX } from 'preact'
import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceCards, ChoiceCircles, ChoicePills } from '../../../../shared/ui/Choice.tsx'
import { DumbbellIcon, FlameIcon, HeartIcon } from '../../components/GoalIcons.tsx'
import { OnboardingLayout } from '../../components/OnboardingLayout.tsx'
import {
  answer,
  daysOptionsFor,
  goalOptions,
  levelOptions,
  onboardingAnswers,
  type Goal,
} from '../../state/onboarding.ts'
import { completeOnboarding } from '../../use-cases/completeOnboarding.ts'

const STEPS = 2

const GOAL_ICONS: Record<Goal, () => JSX.Element> = {
  gain_muscle: DumbbellIcon,
  lose_fat: FlameIcon,
  feel_better: HeartIcon,
}

function Next(props: { href?: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <Button chevron="inline" href={props.href} onClick={props.onClick} disabled={props.disabled}>
      Siguiente
    </Button>
  )
}

/** A03 · Define tu objetivo. */
function StepGoal() {
  return (
    <OnboardingLayout
      step={1}
      total={STEPS}
      title="Define tu objetivo"
      intro="Elige qué quieres conseguir. Puedes cambiarlo más adelante."
      action={<Next href={paths.onboarding(2)} />}
    >
      <ChoiceCards
        name="objetivo"
        legend="Objetivo"
        value={onboardingAnswers.value.goal}
        onChange={(goal) => answer({ goal })}
        options={goalOptions.map((goal) => {
          const Icon = GOAL_ICONS[goal.id]
          return { value: goal.id, label: goal.title, detail: goal.detail, icon: <Icon /> }
        })}
      />
    </OnboardingLayout>
  )
}

/** A04 · Personaliza tu plan. Al terminar guarda el perfil y lleva a elegir la rutina. */
function StepPlan() {
  const { route } = useLocation()
  const [saving, setSaving] = useState(false)

  async function finish() {
    setSaving(true)
    try {
      await completeOnboarding()
      route(paths.chooseRoutine, true)
    } catch (error) {
      logError(error, 'guardar bienvenida')
      setSaving(false)
    }
  }

  return (
    <OnboardingLayout
      step={2}
      total={STEPS}
      title="Personaliza tu plan"
      intro="Cuéntanos tu nivel y disponibilidad para crear el plan perfecto."
      action={<Next onClick={finish} disabled={saving} />}
    >
      <ChoicePills
        name="nivel"
        legend="Nivel"
        showLegend
        value={onboardingAnswers.value.level}
        onChange={(level) => answer({ level })}
        options={levelOptions.map((level) => ({ value: level.id, label: level.label }))}
      />
      <ChoiceCircles
        name="dias"
        legend="Días por semana"
        showLegend
        value={onboardingAnswers.value.daysPerWeek}
        onChange={(daysPerWeek) => answer({ daysPerWeek })}
        options={daysOptionsFor(onboardingAnswers.value.level).map((days) => ({
          value: days,
          label: String(days),
        }))}
      />
    </OnboardingLayout>
  )
}

/** A03–A04: un paso por ruta (/bienvenida/1, /2). */
export function OnboardingScreen(props: { step: string }) {
  if (props.step === '1') return <StepGoal />
  if (props.step === '2') return <StepPlan />
  return (
    <OnboardingLayout
      step={1}
      total={STEPS}
      title="Este paso no existe"
      intro=""
      action={<Next href={paths.welcome} />}
    >
      {null}
    </OnboardingLayout>
  )
}
