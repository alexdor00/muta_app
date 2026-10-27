import type { ComponentChildren } from 'preact'
import styles from './Choice.module.css'

export type ChoiceOption<T> = { value: T; label: string; detail?: string; icon?: ComponentChildren }

type Props<T> = {
  name: string
  legend: string
  /** El título del grupo se ve («Nivel») o solo lo lee el lector de pantalla. */
  showLegend?: boolean
  options: ChoiceOption<T>[]
  value: T
  onChange: (value: T) => void
}

type Look = 'card' | 'pill' | 'circle'
const LIST: Record<Look, string> = { card: styles.cards, pill: styles.pills, circle: styles.days }

function Group<T extends string | number>(props: Props<T> & { look: Look }) {
  return (
    <fieldset class={styles.group}>
      <legend class={props.showLegend ? styles.legend : styles.hiddenLegend}>{props.legend}</legend>
      <div class={LIST[props.look]}>
        {props.options.map((option) => {
          const selected = option.value === props.value
          return (
            <label
              key={String(option.value)}
              class={`${styles.item} ${styles[props.look]} ${selected ? styles.selected : ''}`}
            >
              <input
                class={styles.radio}
                type="radio"
                name={props.name}
                value={String(option.value)}
                checked={selected}
                onChange={() => props.onChange(option.value)}
              />
              {props.look === 'card' ? (
                <>
                  <span class={styles.badge}>{option.icon}</span>
                  <span class={styles.text}>
                    <span class={styles.title}>{option.label}</span>
                    <span class={styles.detail}>{option.detail}</span>
                  </span>
                  <span class={styles.dot} aria-hidden="true" />
                </>
              ) : (
                option.label
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Tarjetas con icono, título, detalle y círculo de selección (una opción). */
export function ChoiceCards<T extends string>(props: Props<T>) {
  return <Group {...props} look="card" />
}

/** Pastillas en fila; la elegida en negro. */
export function ChoicePills<T extends string>(props: Props<T>) {
  return <Group {...props} look="pill" />
}

/** Círculos con número; el elegido en negro. Misma altura que las pastillas. */
export function ChoiceCircles(props: Props<number>) {
  return <Group {...props} look="circle" />
}
