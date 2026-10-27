import type { ComponentChildren } from 'preact'
import styles from './Onboarding.module.css'

type Props = {
  step: number
  total: number
  title: string
  intro: string
  /** Contenido del paso (foto, opciones…). */
  children: ComponentChildren
  contentClass?: string
  /** El botón «Siguiente». */
  action: ComponentChildren
}

/** Esqueleto común de A02–A04: «1/4», título, explicación, contenido y botón abajo. */
export function OnboardingLayout(props: Props) {
  return (
    <section class={styles.screen} aria-labelledby="onboarding-title">
      <p class={styles.step}>
        {props.step}/{props.total}
      </p>
      <h1 id="onboarding-title" class={styles.title}>
        {props.title}
      </h1>
      <p class={styles.intro}>{props.intro}</p>
      <div class={`${styles.content} ${props.contentClass ?? ''}`}>{props.children}</div>
      <div class={styles.footer}>{props.action}</div>
    </section>
  )
}
