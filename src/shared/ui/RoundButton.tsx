import type { ComponentChildren } from 'preact'
import styles from './RoundButton.module.css'

type Props = {
  /** Lo que lee el lector de pantalla (el botón solo tiene icono). */
  label: string
  children: ComponentChildren
  href?: string
  onClick?: () => void
  /** onPhoto: círculo blanco sobre una foto · plain: solo el icono (barras). */
  variant?: 'onPhoto' | 'plain'
  pressed?: boolean
}

/** Botón redondo de icono (volver, filtros, guardar). */
export function RoundButton({ label, children, href, onClick, variant = 'onPhoto', pressed }: Props) {
  const className = `${styles.button} ${variant === 'plain' ? styles.plain : ''}`
  if (href) {
    return (
      <a class={className} href={href} aria-label={label} onClick={onClick}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" class={className} aria-label={label} aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}
