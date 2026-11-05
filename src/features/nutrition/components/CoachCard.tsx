import { SparkIcon } from '../../../shared/ui/icons.tsx'
import styles from './CoachCard.module.css'

type Props = { titulo: string; texto: string; onVer: () => void }

/** El aviso del entrenador en Comida: solo sale cuando tiene algo que proponerte. */
export function CoachCard({ titulo, texto, onVer }: Props) {
  return (
    <button type="button" class={styles.card} onClick={onVer}>
      <span class={styles.badge} aria-hidden="true">
        <SparkIcon />
      </span>
      <span class={styles.text}>
        <span class={styles.eyebrow}>{titulo}</span>
        <span class={styles.title}>{texto}</span>
      </span>
      <span class={styles.see}>Ver</span>
    </button>
  )
}
