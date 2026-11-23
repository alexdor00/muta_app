import { desdeEntreno, paths } from '../../../shared/lib/paths.ts'
import { CheckIcon, MoonIcon } from '../../../shared/ui/icons.tsx'
import styles from './WeekCard.module.css'

export type WeekDay = {
  letra: string
  dia: number
  sigla: string
  estado: 'hecho' | 'hoy' | 'pendiente' | 'descanso'
  hoy: boolean
}

/** `total`: entrenos de tu semana (las sesiones de la rutina). */
type Props = { dias: readonly WeekDay[]; total: number }

/**
 * «Tu semana»: entrenos hechos, barra de progreso y un círculo por día: ✓ lo hecho, la luna los descansos (también los que
 * tocan) y la sigla de lo que toca (sin leyenda: se entiende sola). Toda la tarjeta lleva al calendario de Progreso.
 */
export function WeekCard({ dias, total }: Props) {
  const hechos = dias.filter((d) => d.estado === 'hecho').length
  return (
    <section class={styles.card} aria-labelledby="tu-semana">
      <div class={styles.head}>
        <h2 id="tu-semana" class={styles.eyebrow}>
          Tu semana
        </h2>
        <p class={styles.count}>
          <strong>{hechos}</strong> de {total} entrenos
        </p>
      </div>
      {/* Toda la tarjeta se toca: lleva al calendario de tus entrenos en Progreso */}
      <a class={styles.link} href={desdeEntreno(paths.progress)} aria-label="Ver tu calendario" />
      <progress class={styles.bar} value={hechos} max={total} aria-label="Entrenos de la semana" />
      <ol class={styles.days}>
        {dias.map((d) => (
          <li key={d.letra} class={`${styles.day} ${styles[d.estado]}`}>
            <span class={styles.letter}>{d.letra}</span>
            <span class={styles.circle} role="img" aria-label={`${d.letra} ${d.dia}: ${d.estado}`}>
              {d.estado === 'hecho' ? <CheckIcon /> : d.estado === 'descanso' ? <MoonIcon /> : d.sigla}
            </span>
            <span class={styles.note}>{d.hoy ? 'HOY' : d.estado === 'hecho' ? d.sigla : ''}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
