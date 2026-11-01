import type { JSX } from 'preact'
import {
  BodyIcon,
  BookIcon,
  CameraIcon,
  ChatIcon,
  ChevronRightIcon,
  SparkIcon,
} from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './TuRutinaSheet.module.css'

const ROWS: { label: string; Icon: () => JSX.Element }[] = [
  { label: 'Añadir foto a la sesión', Icon: CameraIcon },
  { label: 'Biblioteca de ejercicios', Icon: BookIcon },
  { label: 'Cobertura muscular', Icon: BodyIcon },
  { label: 'Rehacer el plan con mis respuestas', Icon: SparkIcon },
  { label: 'Mis consejos', Icon: ChatIcon },
]

/** Hoja «Tu rutina»: las opciones de la rutina. Aún sin pantalla propia: solo se ven. */
export function TuRutinaSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Tu rutina" onClose={onClose} large>
      <ul class={styles.list}>
        {ROWS.map(({ label, Icon }) => (
          <li key={label}>
            <button type="button" class={styles.row}>
              <span class={styles.icon}>
                <Icon />
              </span>
              <span class={styles.label}>{label}</span>
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
