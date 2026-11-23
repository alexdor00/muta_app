import styles from './RestBar.module.css'

type Props = {
  /** Segundos que quedan; negativos cuando ya se pasó («+0:03»). */
  quedan: number
  /** El tiempo ya escrito: «2:44» o «+0:03». */
  tiempo: string
  /** Lo que queda del descanso, de 1 a 0: el anillo se vacía. */
  parte: number
  /** Parado: el tiempo en gris y el anillo quieto; tocar lo sigue. */
  parado: boolean
  onPausar: () => void
  onSaltar: () => void
}

/**
 * Descanso entre series (propuesta 6, 2026-11-12): una tarjeta negra que flota abajo, con un anillo que se vacía,
 * «DESCANSO» y el tiempo (al acabar, «¡A POR ELLA!» y «+0:03») y «Saltar».
 */
export function RestBar({ quedan, tiempo, parte, parado, onPausar, onSaltar }: Props) {
  const acabado = quedan <= 0
  return (
    <div
      class={`${styles.bar} ${acabado ? styles.over : ''} ${parado ? styles.parado : ''}`}
      role="timer"
      aria-label="Descanso"
    >
      {/* Tocar el anillo o el tiempo lo para o lo sigue */}
      <button
        type="button"
        class={styles.pausar}
        aria-label={parado ? 'Seguir el descanso' : 'Parar el descanso'}
        aria-pressed={parado}
        onClick={onPausar}
      >
        <svg class={styles.ring} viewBox="0 0 52 52" aria-hidden="true">
          <circle class={styles.track} cx="26" cy="26" r="21" />
          <circle
            class={styles.arc}
            cx="26"
            cy="26"
            r="21"
            pathLength={100}
            style={{ strokeDasharray: `${parte * 100} 100` }}
          />
        </svg>
        <div class={styles.text}>
          <span class={styles.label}>{parado ? 'En pausa' : acabado ? '¡A por ella!' : 'Descanso'}</span>
          <b class={styles.time}>{tiempo}</b>
        </div>
      </button>
      <button type="button" class={styles.skip} onClick={onSaltar}>
        Saltar
      </button>
    </div>
  )
}
