import styles from './DayPicker.module.css'

type Props = {
  /** Texto pequeño sobre el título («Mujer / Base»). */
  eyebrow: string
  title: string
  hint: string
  days: number[]
  value: number
  onChange: (days: number) => void
}

/** Elegir la frecuencia semanal: un botón grande por cada número de días disponible. */
export function DayPicker({ eyebrow, title, hint, days, value, onChange }: Props) {
  // Con cuatro opciones o más no cabe «días/semana» en una fila: queda «días»
  const unit = days.length > 3 ? 'días' : 'días/semana'
  return (
    <section class={styles.picker}>
      <p class={styles.eyebrow}>{eyebrow}</p>
      <fieldset class={styles.group}>
        <legend class={styles.title}>{title}</legend>
        <p class={styles.hint}>{hint}</p>
        <div class={styles.options}>
          {days.map((d) => (
            <label key={d} class={`${styles.option} ${d === value ? styles.selected : ''}`}>
              <input
                class={styles.radio}
                type="radio"
                name="dias-semana"
                value={d}
                checked={d === value}
                onChange={() => onChange(d)}
              />
              <span class={styles.number}>{d}</span>
              <span class={styles.unit}>{unit}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  )
}
