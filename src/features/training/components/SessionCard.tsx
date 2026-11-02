import { paths } from '../../../shared/lib/paths.ts'
import styles from './SessionCard.module.css'
import tones from './sessionTone.module.css'

type Props = {
  sigla: string
  nombre: string
  detalle: string
  /** Cómo va en la semana: «Hoy», «Hecha», «Pendiente». */
  estado: string
  /** Color de la tarjeta (1–4: lima, rayas, naranja, negro). */
  tono: 1 | 2 | 3 | 4
}

/** Tarjeta de color de una sesión, con la sigla de fondo; al tocarla se abre Ver sesión. */
export function SessionCard({ sigla, nombre, detalle, estado, tono }: Props) {
  return (
    <a
      class={`${styles.card} ${tones[`tone${tono}`]} ${tono === 2 ? styles.noGhost : ''}`}
      href={paths.sessionView(sigla.toLowerCase())}
    >
      <span class={styles.ghost} aria-hidden="true">
        {sigla}
      </span>
      <span class={styles.estado}>{estado}</span>
      <span class={styles.sigla}>{sigla}</span>
      <h2 class={styles.name}>{nombre}</h2>
      <span class={styles.detail}>{detalle}</span>
    </a>
  )
}
