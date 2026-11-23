import { ChevronLeftIcon, ChevronRightIcon } from './icons.tsx'
import styles from './DayNav.module.css'

type Props = {
  /** «Hoy», «Ayer», «Mar 3 nov» o el mes. */
  titulo: string
  /** Debajo, en gris: el día completo o el año. */
  detalle?: string
  /** Lo que se lee en voz alta: el día completo. */
  etiqueta: string
  /** null si no hay antes (el primer mes con datos). */
  onAntes: (() => void) | null
  /** null si ya es hoy (no se apunta en el futuro). */
  onDespues: (() => void) | null
  /** Lo que se mueve: un día (Comida) o un mes (Progreso). */
  paso?: 'Día' | 'Mes'
  /** Sin flechas a la vista (se cambia deslizando); siguen ahí para el teclado y el lector de pantalla. */
  sinFlechas?: boolean
}

/**
 * El día (o el mes) que ves, encima de su tarjeta: ‹ Hoy › con la fecha debajo, para ver y apuntar en otro día. Las
 * flechas, en círculos a los lados (propuesta «tarjetas», 2026-11-12).
 */
export function DayNav({
  titulo,
  detalle,
  etiqueta,
  onAntes,
  onDespues,
  paso = 'Día',
  sinFlechas = false,
}: Props) {
  const anterior = paso === 'Día' ? 'Día anterior' : 'Mes anterior'
  const siguiente = paso === 'Día' ? 'Día siguiente' : 'Mes siguiente'
  return (
    <nav class={styles.nav} aria-label={paso}>
      <button
        type="button"
        class={`${styles.arrow} ${sinFlechas ? styles.oculta : ''}`}
        aria-label={anterior}
        disabled={!onAntes}
        onClick={onAntes ?? undefined}
      >
        <ChevronLeftIcon />
      </button>
      <span class={styles.centro} aria-live="polite" aria-label={etiqueta}>
        <span class={styles.title}>{titulo}</span>
        {detalle && <span class={styles.detalle}>{detalle}</span>}
      </span>
      <button
        type="button"
        class={`${styles.arrow} ${sinFlechas ? styles.oculta : ''}`}
        aria-label={siguiente}
        disabled={!onDespues}
        onClick={onDespues ?? undefined}
      >
        <ChevronRightIcon />
      </button>
    </nav>
  )
}
