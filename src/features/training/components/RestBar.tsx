import styles from './RestBar.module.css'

type Props = {
  /** Segundos que quedan; negativos cuando ya se pasó («+0:03»). */
  quedan: number
  /** El tiempo ya escrito: «2:44» o «+0:03». */
  tiempo: string
  onSaltar: () => void
}

/**
 * Descanso entre series, abajo: barra baja a lo ancho con «DESCANSO 2:44»; en los últimos 15 s, «PREPÁRATE» (mentalízate:
 * guía G1); al acabar, «¡A POR ELLA! +0:03»; y Saltar.
 */
export function RestBar({ quedan, tiempo, onSaltar }: Props) {
  const acabado = quedan <= 0
  return (
    <div class={`${styles.bar} ${acabado ? styles.over : ''}`} role="timer" aria-label="Descanso">
      <div class={styles.text}>
        <span class={styles.label}>{acabado ? '¡A por ella!' : quedan <= 15 ? 'Prepárate' : 'Descanso'}</span>
        <b class={styles.time}>{tiempo}</b>
      </div>
      <button type="button" class={styles.skip} onClick={onSaltar}>
        Saltar
      </button>
    </div>
  )
}
