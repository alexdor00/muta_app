import { Switch } from '../../../shared/ui/Switch.tsx'
import styles from './EquipmentList.module.css'

/**
 * Tu material (Perfil): un interruptor por material. Lo que no tienes va al final, en gris, en la biblioteca y al cambiar
 * un ejercicio.
 */
export function EquipmentList(props: {
  materiales: readonly { id: string; label: string; tienes: boolean }[]
  onCambio: (id: string, tienes: boolean) => void
}) {
  return (
    <section class={styles.section} aria-labelledby="tu-material">
      <h2 id="tu-material" class={styles.title}>
        Tu material
      </h2>
      <ul class={styles.list}>
        {props.materiales.map((m) => (
          <li key={m.id} class={styles.row}>
            <span>{m.label}</span>
            <Switch checked={m.tienes} label={m.label} onChange={(on) => props.onCambio(m.id, on)} />
          </li>
        ))}
      </ul>
      <p class={styles.hint}>
        Lo que tienes donde entrenas; el peso corporal cuenta siempre. En la biblioteca y al cambiar un
        ejercicio, los que no puedes hacer bajan al final, en gris: se pueden elegir igual.
      </p>
    </section>
  )
}
