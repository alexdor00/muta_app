import { ChevronRightIcon, PlusIcon, SwapIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './TuRutinaSheet.module.css'

/**
 * El «···» de la ficha del ejercicio: solo lo que la ficha no hace ya (sus notas, su descanso y sus músculos están en
 * ella). «Cambiar en tu plan por otro» sale si el ejercicio está en tu plan.
 */
export function ExerciseMoreSheet(props: {
  titulo: string
  onAnadir: () => void
  /** Sin él (no está en tu plan), no sale la fila. */
  onCambiar?: () => void
  onClose: () => void
}) {
  const filas = [
    { label: 'Añadir a una sesión', Icon: PlusIcon, onClick: props.onAnadir },
    ...(props.onCambiar
      ? [{ label: 'Cambiar en tu plan por otro', Icon: SwapIcon, onClick: props.onCambiar }]
      : []),
  ]
  return (
    <Sheet title={props.titulo} onClose={props.onClose}>
      <ul class={styles.list}>
        {filas.map((f) => (
          <li key={f.label}>
            <button type="button" class={styles.row} onClick={f.onClick}>
              <span class={styles.icon}>
                <f.Icon />
              </span>
              <span class={styles.label}>{f.label}</span>
              <span class={styles.chevron}>
                <ChevronRightIcon />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
