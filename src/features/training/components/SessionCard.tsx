import { paths } from '../../../shared/lib/paths.ts'
import styles from './SessionCard.module.css'

type Props = {
  sigla: string
  nombre: string
  detalle: string
  /** Cómo va en la semana: «Hoy», «Hecha», «Pendiente». */
  estado: string
  /** Color de la tarjeta (1–4: lima, rayas, naranja, negro). */
  tono: 1 | 2 | 3 | 4
}

/** Tarjeta cuadrada y de color de una sesión, con la sigla de fondo; se abre al tocarla. */
export function SessionCard({ sigla, nombre, detalle, estado, tono }: Props) {
  return (
    <a class={`${styles.card} ${styles[`tone${tono}`]}`} href={paths.routine}>
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
