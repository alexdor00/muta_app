import { DumbbellIcon, MoonIcon } from '../../../shared/ui/icons.tsx'
import styles from './DietWeek.module.css'

export type DiaDieta = {
  fecha: string
  letra: string
  /** La letra del menú («A»). */
  menu: string
  entreno: boolean
  hoy: boolean
}

type Props = { dias: DiaDieta[]; onDia: (fecha: string) => void }

/** Tu semana con la dieta, como Tu semana de Entreno: un círculo por día con su menú y si entrenas o descansas. */
export function DietWeek({ dias, onDia }: Props) {
  const entrenos = dias.filter((d) => d.entreno).length
  return (
    <section class={styles.card} aria-labelledby="semana-dieta">
      <div class={styles.head}>
        <h2 id="semana-dieta" class={styles.eyebrow}>
          Tu semana
        </h2>
        <span class={styles.count}>
          <strong>{entrenos}</strong> de entreno · {dias.length - entrenos} de descanso
        </span>
      </div>
      <ol class={styles.days}>
        {dias.map((d) => (
          <li key={d.fecha} class={styles.day}>
            <span class={styles.letter} aria-hidden="true">
              {d.letra}
            </span>
            <button
              type="button"
              class={`${styles.circle} ${d.hoy ? styles.today : ''} ${d.entreno ? '' : styles.rest}`}
              aria-label={`${d.hoy ? 'Hoy' : d.letra}: menú ${d.menu}, ${d.entreno ? 'entreno' : 'descanso'}`}
              onClick={() => onDia(d.fecha)}
            >
              {d.menu}
            </button>
            <span class={styles.note} aria-hidden="true">
              {d.hoy ? 'HOY' : d.entreno ? <DumbbellIcon /> : <MoonIcon />}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
