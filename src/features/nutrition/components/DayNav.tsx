import { ChevronLeftIcon, ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import styles from './DayNav.module.css'

type Props = {
  /** «Hoy», «Ayer» o «Mar 3 nov». */
  titulo: string
  /** Lo que se lee en voz alta: el día completo. */
  etiqueta: string
  onAntes: () => void
  /** null si ya es hoy (no se apunta en el futuro). */
  onDespues: (() => void) | null
  /** Dentro de la tarjeta del día: sin fondo propio, centrado y con las flechas en círculos. */
  dentro?: boolean
}

/** El día que ves: ‹ Hoy ›, para ver y apuntar en otro día. */
export function DayNav({ titulo, etiqueta, onAntes, onDespues, dentro }: Props) {
  return (
    <nav class={`${styles.nav} ${dentro ? styles.dentro : ''}`} aria-label="Día">
      <button type="button" class={styles.arrow} aria-label="Día anterior" onClick={onAntes}>
        <ChevronLeftIcon />
      </button>
      <span class={styles.title} aria-live="polite" aria-label={etiqueta}>
        {titulo}
      </span>
      <button
        type="button"
        class={styles.arrow}
        aria-label="Día siguiente"
        disabled={!onDespues}
        onClick={onDespues ?? undefined}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  )
}
