import { SparkIcon } from '../../../shared/ui/icons.tsx'
import styles from './CoachCard.module.css'

type Props = {
  titulo: string
  texto: string
  /** El texto de la píldora («Ver», «Empezar»). */
  ver?: string
  onVer: () => void
}

/** El aviso del entrenador (o del nutricionista) en Comida: solo sale cuando tiene algo para ti. */
export function CoachCard({ titulo, texto, ver = 'Ver', onVer }: Props) {
  return (
    <button type="button" class={styles.card} onClick={onVer}>
      <span class={styles.badge} aria-hidden="true">
        <SparkIcon />
      </span>
      <span class={styles.text}>
        <span class={styles.eyebrow}>{titulo}</span>
        <span class={styles.title}>{texto}</span>
      </span>
      <span class={styles.see}>{ver}</span>
    </button>
  )
}
