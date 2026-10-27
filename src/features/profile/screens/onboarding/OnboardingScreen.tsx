import type { JSX } from 'preact'
import { useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { logError } from '../../../../shared/lib/logger.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { DayCircles, OptionCards, Pills } from '../../components/Choices.tsx'
import { DumbbellIcon, FlameIcon, HeartIcon } from '../../components/GoalIcons.tsx'
import styles from '../../components/Onboarding.module.css'
import { OnboardingLayout } from '../../components/OnboardingLayout.tsx'
import {
  answer,
  daysOptions,
  goalOptions,
  levelOptions,
  onboardingAnswers,
  type Goal,
} from '../../state/onboarding.ts'
import { completeOnboarding } from '../../use-cases/completeOnboarding.ts'

// El diseño numera los pasos sobre 4 aunque solo hay 3 pantallas: pendiente de decidir el cuarto.
const SHOWN_TOTAL = 4

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

/** A02 · Tu mejor versión empieza hoy. */
function StepIntro() {
  return (
    <OnboardingLayout
      step={1}
      total={SHOWN_TOTAL}
      title="Tu mejor versión empieza hoy"
      intro="Entrena con un plan diseñado para ti. Hazte tu cuerpo. Haz seguimiento de tu progreso."
      contentClass={styles.photoContent}
      action={<Next href={paths.onboarding(2)} />}
    >
      <img class={styles.photo} src="/photos/onboarding-zancada.jpg" alt="" />
    </OnboardingLayout>
  )
}

/** A03 · Define tu objetivo. */
function StepGoal() {
  return (
    <OnboardingLayout
      step={2}
      total={SHOWN_TOTAL}
      title="Define tu objetivo"
      intro="Elige qué quieres conseguir. Puedes cambiarlo más adelante."
      action={<Next href={paths.onboarding(3)} />}
    >
      <OptionCards
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

/** A04 · Personaliza tu plan. Al terminar guarda el perfil y va a Tu plan. */
function StepPlan() {
  const { route } = useLocation()
  const [saving, setSaving] = useState(false)

  async function finish() {
    setSaving(true)
    try {
      await completeOnboarding()
      route(paths.training, true)
    } catch (error) {
      logError(error, 'guardar bienvenida')
      setSaving(false)
    }
  }

  return (
    <OnboardingLayout
      step={3}
      total={SHOWN_TOTAL}
      title="Personaliza tu plan"
      intro="Cuéntanos tu nivel y disponibilidad para crear el plan perfecto."
      action={<Next onClick={finish} disabled={saving} />}
    >
      <Pills
        name="nivel"
        legend="Nivel"
        showLegend
        value={onboardingAnswers.value.level}
        onChange={(level) => answer({ level })}
        options={levelOptions.map((level) => ({ value: level.id, label: level.label }))}
      />
      <DayCircles
        name="dias"
        legend="Días por semana"
        showLegend
        value={onboardingAnswers.value.daysPerWeek}
        onChange={(daysPerWeek) => answer({ daysPerWeek })}
        options={daysOptions.map((days) => ({ value: days, label: String(days) }))}
      />
    </OnboardingLayout>
  )
}

/** A02�A04: un paso por ruta (/bienvenida/1, /2, /3). */
export function OnboardingScreen(props: { step: string }) {
  if (props.step === '1') return <StepIntro />
  if (props.step === '2') return <StepGoal />
  if (props.step === '3') return <StepPlan />
  return (
    <OnboardingLayout
      step={1}
      total={SHOWN_TOTAL}
      title="Este paso no existe"
      intro=""
      action={<Next href={paths.welcome} />}
    >
      {null}
    </OnboardingLayout>
  )
}
