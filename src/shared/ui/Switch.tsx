import styles from './Switch.module.css'

/**
 * Interruptor (sí / no) con su texto a la izquierda: una casilla con aspecto de interruptor, accesible como «switch».
 * Con `soloLector`, el texto no se ve (lo lee el lector de pantalla): para filas cuyo texto ya está al lado.
 */
export function Switch(props: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  soloLector?: boolean
}) {
  return (
    <label class={props.soloLector ? styles.solo : styles.row}>
      <span class={props.soloLector ? styles.hidden : styles.label}>{props.label}</span>
      <input
        class={styles.input}
        type="checkbox"
        role="switch"
        checked={props.checked}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />
    </label>
  )
}
