import type { ComponentChildren } from 'preact'
import styles from './ScreenHeader.module.css'

type Props = {
  title: string
  intro?: string
  /** Iniciales del usuario; sin ellas se ve una silueta. */
  initials?: string
  /** A dónde lleva el avatar (perfil). */
  avatarHref: string
  /** Botón o enlace de la derecha (icono). */
  action?: ComponentChildren
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
    </svg>
  )
}

/** Cabecera de una pantalla principal de pestaña: avatar, acción y título grande. */
export function ScreenHeader({ title, intro, initials, avatarHref, action }: Props) {
  return (
    <header class={styles.header}>
      <div class={styles.bar}>
        <a class={styles.avatar} href={avatarHref} aria-label="Perfil">
          {initials || <PersonIcon />}
        </a>
        {action && <span class={styles.action}>{action}</span>}
      </div>
      <h1 class={styles.title}>{title}</h1>
      {intro && <p class={styles.intro}>{intro}</p>}
    </header>
  )
}
