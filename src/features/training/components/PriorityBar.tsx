import { ChoiceChips } from '../../../shared/ui/Choice.tsx'
import { Tiles } from '../../../shared/ui/Tiles.tsx'
import styles from './SlotPanel.module.css'

type Props = {
  muscles: string[]
  priorities: string[]
  max: number
  /** Minutos por sesión que se aplican; null = sin límite. */
  minutes: number | null
  onPriorities: (list: string[]) => void
  onMinutes: (minutes: number | null) => void
}

const LIMITS = [45, 60, 75, 90]
const NONE = 'none'

/** Prioridades (máx. 4) y minutos por sesión de las rutinas de MUTA: todo opcional. */
export function PriorityBar({ muscles, priorities, max, minutes, onPriorities, onMinutes }: Props) {
  const full = priorities.length >= max
  return (
    <div class={styles.panel}>
      <p class={styles.hint}>
        Los músculos que quieres mejorar más (hasta {max}) cuentan para los ejercicios opcionales: el hombro
        anterior solo entra si es prioridad. {priorities.length} de {max} elegidos.
      </p>
      <Tiles
        name="prioridades"
        legend="Tus prioridades"
        mode="multi"
        options={muscles.map((m) => ({ value: m, label: m, disabled: full && !priorities.includes(m) }))}
        value={priorities}
        onChange={onPriorities}
      />
      <p class={styles.hint}>
        Duración por sesión: si pasa de este tiempo, quito el último opcional que no sea prioritario y, si no
        queda ninguno, una serie al ejercicio con más series.
      </p>
      <ChoiceChips
        name="minutos"
        legend="Minutos por sesión"
        options={[
          { value: NONE, label: 'Sin límite' },
          ...LIMITS.map((m) => ({ value: String(m), label: m === 75 ? '75 min · normal' : `${m} min` })),
        ]}
        value={minutes === null ? NONE : String(minutes)}
        onChange={(v) => onMinutes(v === NONE ? null : Number(v))}
      />
    </div>
  )
}
