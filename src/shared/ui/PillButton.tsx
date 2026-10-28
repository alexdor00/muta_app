import type { ComponentChildren } from 'preact'
import styles from './PillButton.module.css'

type Props = {
  children: ComponentChildren
  icon?: ComponentChildren
  /** Número pequeño (p. ej. filtros activos). */
  count?: number
  onClick: () => void
}

/** Botón píldora pequeño y negro con icono («Filtros»). */
export function PillButton({ children, icon, count, onClick }: Props) {
  return (
    <button type="button" class={styles.pill} onClick={onClick}>
      {children}
      {count ? <span class={styles.count}>{count}</span> : icon}
    </button>
  )
}
