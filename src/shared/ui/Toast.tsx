import styles from './Toast.module.css'

type Props = {
  message: string | null
  /** Un botón dentro del aviso, p. ej. «Deshacer». */
  action?: { label: string; onClick: () => void } | null
}

/** Aviso corto abajo («Descansa 1 minuto más», «Serie eliminada · Deshacer»). Quien lo pone decide cuándo se quita. */
export function Toast({ message, action }: Props) {
  return (
    <div class={styles.region} role="status" aria-live="polite">
      {message && (
        <p class={styles.toast}>
          {message}
          {action && (
            <button type="button" class={styles.action} onClick={action.onClick}>
              {action.label}
            </button>
          )}
        </p>
      )}
    </div>
  )
}
