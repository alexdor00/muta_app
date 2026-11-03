import { ChevronDownIcon } from '../../../shared/ui/icons.tsx'
import styles from './WorkoutBar.module.css'

type Props = {
  /** Tiempo que lleva la sesión: «0:04». */
  tiempo: string
  /** «B1 · 0 de 24 series». */
  progreso: string
  hechas: number
  total: number
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
 * Barra fija de la sesión en curso: «Salir», el tiempo (tocarlo lo para) y las series hechas, «Terminar» y la raya de
 * progreso.
 */
export function WorkoutBar({
  tiempo,
  progreso,
  hechas,
  total,
  salirHref,
  pausada,
  onPausa,
  onSesion,
  onTerminar,
}: Props) {
  return (
    <header class={styles.bar}>
      <div
        class={styles.track}
        role="progressbar"
        aria-label="Series hechas"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={hechas}
      >
        <i style={{ width: `${total ? (hechas / total) * 100 : 0}%` }} />
      </div>
      <a class={styles.exit} href={salirHref}>
        Salir
      </a>
      <div class={styles.center}>
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
      <button type="button" class={styles.finish} onClick={onTerminar}>
        Terminar
      </button>
    </header>
  )
}
