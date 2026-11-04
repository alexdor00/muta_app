import styles from './Switch.module.css'

/** Interruptor: pista gris, negra si está encendido, con el círculo blanco. `label` es lo que lee el lector de pantalla. */
export function Switch(props: { checked: boolean; label: string; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      class={styles.switch}
      onClick={() => props.onChange(!props.checked)}
    />
  )
}
