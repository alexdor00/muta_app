import type { ComponentChildren } from 'preact'
import styles from './Onboarding.module.css'

type Props = {
  step: number
  total: number
  title: string
  intro: string
  /** Contenido del paso (opciones…). */
  children: ComponentChildren
  /** El botón «Siguiente». */
  action: ComponentChildren
}

/** Esqueleto común de A03–A04: «1/2», título, explicación, contenido y botón abajo. */
export function OnboardingLayout(props: Props) {
  return (
    <section class={styles.screen} aria-labelledby="onboarding-title">
      <p class={`${styles.step} appear`}>
        {props.step}/{props.total}
      </p>
      <h1 id="onboarding-title" class={`${styles.title} appear`}>
        {props.title}
      </h1>
      <p class={`${styles.intro} appear`}>{props.intro}</p>
      <div class={`${styles.content} appear`}>{props.children}</div>
      <div class={`${styles.footer} appear`}>{props.action}</div>
    </section>
  )
}
