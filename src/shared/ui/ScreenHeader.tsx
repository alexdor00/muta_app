import type { ComponentChildren } from 'preact'
import { useLocation } from 'preact-iso'
import { volverA } from '../lib/paths.ts'
import { ChevronLeftIcon } from './icons.tsx'
import styles from './ScreenHeader.module.css'

type Props = {
  title: string
  intro?: string
  /** Iniciales del usuario; sin ellas se ve una silueta. */
  initials?: string
  /** A dónde lleva el avatar (perfil). Sin él, no hay avatar (Nutrición: sus botones ocupan la fila). */
  avatarHref?: string
  /** Botón o enlace de la derecha (icono); en la fila, a la izquierda del avatar. */
  action?: ComponentChildren
  /** El título (más pequeño, en negrita) y el avatar en la misma fila, el avatar a la derecha (Entrenamiento). */
  inline?: boolean
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
    </svg>
  )
}

/** «‹ Hoy» (o «‹ Entrenamiento») encima del título, solo si llegaste desde allí. */
function VolverAHoy() {
  const { query } = useLocation()
  const atras = volverA(query)
  if (!atras) return null
  return (
    <a class={styles.volver} href={atras.href}>
      <ChevronLeftIcon />
      {atras.label}
    </a>
  )
}

/** Cabecera de una pantalla principal de pestaña: avatar, acción y título grande (y «‹ Hoy» si vienes de Hoy). */
export function ScreenHeader({ title, intro, initials, avatarHref, action, inline }: Props) {
  const avatar = avatarHref && (
    <a class={styles.avatar} href={avatarHref} aria-label="Perfil">
      {initials || <PersonIcon />}
    </a>
  )
  if (inline) {
    return (
      <header class={`${styles.header} ${styles.inline}`}>
        <VolverAHoy />
        <h1 class={styles.inlineTitle}>{title}</h1>
        <span class={styles.inlineEnd}>
          {action}
          {avatar}
        </span>
      </header>
    )
  }
  return (
    <header class={styles.header}>
      <VolverAHoy />
      <div class={styles.bar}>
        {avatar}
        {action && <span class={styles.action}>{action}</span>}
      </div>
      <h1 class={styles.title}>{title}</h1>
      {intro && <p class={styles.intro}>{intro}</p>}
    </header>
  )
}
