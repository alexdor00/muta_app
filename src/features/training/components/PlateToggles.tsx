import styles from './PlateToggles.module.css'

/**
 * Los discos que hay en tu gimnasio: uno por peso, encendido si lo hay. Sale en Tu material (Perfil) y en la calculadora
 * de discos de la sesión.
 */
export function PlateToggles(props: {
  discos: readonly { kg: number; label: string; hay: boolean }[]
  onCambio: (kg: number, hay: boolean) => void
}) {
  return (
    <div class={styles.row} role="group" aria-label="Discos del gimnasio">
      {props.discos.map((d) => (
        <button
          key={d.kg}
          type="button"
          class={`${styles.plate} ${d.hay ? styles.on : ''}`}
          aria-pressed={d.hay}
          aria-label={`Discos de ${d.label} kg`}
          onClick={() => props.onCambio(d.kg, !d.hay)}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}
