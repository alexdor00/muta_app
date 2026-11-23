import { ChevronDownIcon, ChevronLeftIcon } from '../../../shared/ui/icons.tsx'
import styles from './WorkoutBar.module.css'

type Props = {
  /** Tiempo que lleva la sesión: «0:04». */
  tiempo: string
  /** «B1 · 0 de 24 series». */
  progreso: string
  salirHref: string
  /** El tiempo está parado; tocarlo lo para o lo vuelve a poner en marcha. */
  pausada: boolean
  onPausa: () => void
  /** La línea de las series abre «Esta sesión» (C08). */
  onSesion: () => void
  /** Quien la pone decide si se puede terminar (p. ej. avisa si no hay ninguna serie hecha). */
  onTerminar: () => void
}

/**
 * Barra fija de la sesión en curso (propuesta 6, 2026-11-12): a la izquierda, ‹ para salir y el tiempo (tocarlo lo para)
 * con las series hechas debajo; a la derecha, «Terminar», el único negro fuerte de la pantalla.
 */
export function WorkoutBar({ tiempo, progreso, salirHref, pausada, onPausa, onSesion, onTerminar }: Props) {
  return (
    <header class={styles.bar}>
      <div class={styles.left}>
        <a class={styles.exit} href={salirHref} aria-label="Salir">
          <ChevronLeftIcon />
        </a>
        <div class={styles.clock}>
          <button
            type="button"
            class={`${styles.time} ${pausada ? styles.paused : ''}`}
            aria-label={`Tiempo de la sesión: ${tiempo}${pausada ? ', en pausa' : ''}. Tócalo para ${pausada ? 'seguir' : 'pararlo'}`}
            onClick={onPausa}
          >
            {tiempo}
          </button>
          <button
            type="button"
            class={styles.progress}
            aria-label={`Esta sesión: ${progreso}`}
            onClick={onSesion}
          >
            {pausada ? 'En pausa' : progreso}
            <ChevronDownIcon />
          </button>
        </div>
      </div>
      <button type="button" class={styles.finish} onClick={onTerminar}>
        Terminar
      </button>
    </header>
  )
}
