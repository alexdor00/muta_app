import type { ComponentChildren } from 'preact'
import styles from './Button.module.css'

type Props = {
  children: ComponentChildren
  /** primary: píldora negra · onPhoto: píldora blanca sobre foto · secondary: gris */
  variant?: 'primary' | 'onPhoto' | 'secondary'
  /** Flecha › cuando lleva a otra pantalla. */
  chevron?: boolean
  href?: string
  onClick?: () => void
}

function Chevron() {
  return (
    <svg class={styles.chevron} viewBox="0 0 8 14" aria-hidden="true">
      <path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  )
}

/** Botón principal de la pantalla (una sola acción principal por pantalla). */
export function Button({ children, variant = 'primary', chevron = false, href, onClick }: Props) {
  const className = `${styles.button} ${styles[variant]}`
  const content = (
    <>
      {children}
      {chevron && <Chevron />}
    </>
  )
  if (href) {
    return (
      <a class={className} href={href} onClick={onClick}>
        {content}
      </a>
    )
  }
  return (
    <button type="button" class={className} onClick={onClick}>
      {content}
    </button>
  )
}
