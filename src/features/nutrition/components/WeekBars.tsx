import { formatInt } from '../../../shared/lib/format.ts'
import styles from './WeekBars.module.css'

type Dia = { letra: string; kcal: number; hoy: boolean }

type Props = { dias: Dia[]; objetivo: number }

/** Barras de kcal de los 7 últimos días con la raya de tu objetivo; hoy, en gris (aún no ha terminado). */
export function WeekBars({ dias, objetivo }: Props) {
  const tope = Math.max(objetivo * 1.2, ...dias.map((d) => d.kcal))
  const alto = (kcal: number) => `${(kcal / tope) * 100}%`
  return (
    <figure class={styles.chart}>
      <div class={styles.area}>
        <span class={styles.goal} style={{ bottom: alto(objetivo) }}>
          <span class={styles.goalLabel}>Objetivo {formatInt(objetivo)}</span>
        </span>
        {dias.map((d, i) => (
          <span key={i} class={styles.col}>
            <span class={`${styles.bar} ${d.hoy ? styles.today : ''}`} style={{ height: alto(d.kcal) }} />
          </span>
        ))}
      </div>
      <div class={styles.labels} aria-hidden="true">
        {dias.map((d, i) => (
          <span key={i} class={d.hoy ? styles.todayLabel : ''}>
            {d.hoy ? 'Hoy' : d.letra}
          </span>
        ))}
      </div>
      <figcaption class={styles.hidden}>
        {dias.map((d) => `${d.hoy ? 'Hoy' : d.letra}: ${formatInt(d.kcal)} kcal`).join('. ')}
      </figcaption>
    </figure>
  )
}
