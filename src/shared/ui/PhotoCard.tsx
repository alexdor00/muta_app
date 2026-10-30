import type { ComponentChildren } from 'preact'
import styles from './PhotoCard.module.css'

type Props = {
  title: string
  subtitle?: string
  /** Foto de fondo; sin foto se usa el degradado `tone`. */
  photo?: string
  tone?: 1 | 2 | 3 | 4 | 5 | 6
  /** Etiqueta pequeña arriba a la izquierda («Tu rutina»…). */
  badge?: string
  onClick?: () => void
  /** Botón redondo arriba a la derecha (p. ej. la «!» de información). Va fuera del botón de la tarjeta. */
  action?: ComponentChildren
}

/** Tarjeta grande con foto y título en blanco abajo (lista de rutinas, entrenamientos…). */
export function PhotoCard({ title, subtitle, photo, tone = 1, badge, onClick, action }: Props) {
  const card = (
    <button type="button" class={`${styles.card} ${styles[`t${tone}`]}`} onClick={onClick}>
      {photo && <img class={styles.photo} src={photo} alt="" loading="lazy" />}
      <span class={styles.scrim} />
      {badge && <span class={styles.badge}>{badge}</span>}
      <span class={styles.text}>
        <span class={styles.title}>{title}</span>
        {subtitle && <span class={styles.subtitle}>{subtitle}</span>}
      </span>
    </button>
  )
  if (!action) return card
  return (
    <div class={styles.wrap}>
      {card}
      <div class={styles.action}>{action}</div>
    </div>
  )
}
