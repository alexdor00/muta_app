import { CheckIcon } from './icons.tsx'
import styles from './Tiles.module.css'

export type Tile = {
  value: string
  label: string
  /** Texto pequeño bajo el nombre («3 ejercicios»). */
  detail?: string
  disabled?: boolean
}

type Props = {
  name: string
  legend: string
  /** El título del grupo se ve o solo lo lee el lector de pantalla. */
  showLegend?: boolean
  options: Tile[]
  /** Valores marcados (uno en modo single). */
  value: string[]
  onChange: (value: string[]) => void
  /** single: una opción (círculo) · multi: varias (casilla). */
  mode?: 'single' | 'multi'
}

/** Azulejos en dos columnas para elegir entre muchas opciones cortas (músculos, equipamiento…). */
export function Tiles({ name, legend, showLegend, options, value, onChange, mode = 'single' }: Props) {
  function toggle(option: Tile) {
    if (mode === 'single') return onChange([option.value])
    onChange(
      value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value],
    )
  }
  return (
    <fieldset class={styles.group}>
      <legend class={showLegend ? styles.legend : styles.hiddenLegend}>{legend}</legend>
      <div class={styles.grid}>
        {options.map((option) => {
          const selected = value.includes(option.value)
          return (
            <label
              key={option.value}
              class={`${styles.tile} ${selected ? styles.selected : ''} ${option.disabled ? styles.disabled : ''}`}
            >
              <input
                class={styles.input}
                type={mode === 'single' ? 'radio' : 'checkbox'}
                name={name}
                value={option.value}
                checked={selected}
                disabled={option.disabled}
                onChange={() => toggle(option)}
              />
              <span class={styles.label}>{option.label}</span>
              {option.detail && <span class={styles.detail}>{option.detail}</span>}
              <span class={styles.mark} aria-hidden="true">
                {selected && <CheckIcon />}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
