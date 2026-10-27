import type { ComponentChildren } from 'preact'
import styles from './Onboarding.module.css'

type Option<T> = { value: T; label: string; detail?: string; icon?: ComponentChildren }

type Props<T> = {
  name: string
  legend: string
  /** El título del grupo se ve («Nivel») o solo lo lee el lector de pantalla. */
  showLegend?: boolean
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

function Group<T extends string | number>(
  props: Props<T> & { look: 'card' | 'pill' | 'day'; listClass: string },
) {
  const itemClass = { card: styles.option, pill: styles.pill, day: styles.day }[props.look]
  return (
    <fieldset class={styles.group}>
      <legend class={styles.legend} style={props.showLegend ? undefined : srOnly}>
        {props.legend}
      </legend>
      <div class={props.listClass}>
        {props.options.map((option) => {
          const selected = option.value === props.value
          return (
            <label key={String(option.value)} class={`${itemClass} ${selected ? styles.selected : ''}`}>
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
                  <span class={styles.icon}>{option.icon}</span>
                  <span class={styles.optionText}>
                    <span class={styles.optionTitle}>{option.label}</span>
                    <span class={styles.optionDetail}>{option.detail}</span>
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

const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
}

/** A03: tarjetas con icono, título, detalle y círculo de selección. */
export function OptionCards<T extends string>(props: Props<T>) {
  return <Group {...props} look="card" listClass={styles.options} />
}

/** A04 · Nivel: pastillas; la elegida en negro. */
export function Pills<T extends string>(props: Props<T>) {
  return <Group {...props} look="pill" listClass={styles.pills} />
}

/** A04 · Días por semana: círculos con número; el elegido en negro y algo mayor. */
export function DayCircles(props: Props<number>) {
  return <Group {...props} look="day" listClass={styles.days} />
}
