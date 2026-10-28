import { ChoiceChips } from '../../../shared/ui/Choice.tsx'
import { Tiles } from '../../../shared/ui/Tiles.tsx'
import styles from './WeakPointPicker.module.css'

type OptionalView = {
  key: string
  name: string
  muscle: string
  days: string[]
  included: boolean
  /** Marcado, pero la regla de tiempo lo ha quitado. */
  trimmed: boolean
  reason: string | null
}
export type PriorityChoiceView = {
  priorities: string[]
  optionals: Record<string, boolean>
  maxMinutes?: number | null
}

type Props = {
  muscles: string[]
  optionals: OptionalView[]
  choice: PriorityChoiceView | null
  max: number
  /** Minutos por sesión que se aplican ahora; null = sin límite. */
  minutes: number | null
  onChange: (choice: PriorityChoiceView) => void
}

const LIMITS = [45, 60, 75, 90]
const NONE = 'none'

/** Prioridades (máx. 4), ejercicios opcionales a tu gusto y minutos por sesión (todo opcional). */
export function PriorityPicker({ muscles, optionals, choice, max, minutes, onChange }: Props) {
  const priorities = choice?.priorities ?? []
  const overrides = choice?.optionals ?? {}
  const full = priorities.length >= max
  const keep = (extra: Partial<PriorityChoiceView>): PriorityChoiceView => ({
    priorities,
    optionals: overrides,
    ...(choice && 'maxMinutes' in choice ? { maxMinutes: choice.maxMinutes } : {}),
    ...extra,
  })

  function setOptionals(keys: string[]) {
    const on = new Set(keys)
    const next = { ...overrides }
    for (const o of optionals) if (on.has(o.key) !== o.included) next[o.key] = on.has(o.key)
    onChange(keep({ optionals: next }))
  }

  return (
    <div class={styles.picker}>
      <section class={styles.block}>
        <h3 class={styles.h3}>Tus prioridades</h3>
        <p class={styles.hint}>
          Los músculos que quieres mejorar más, hasta {max}. Si no eliges ninguno, la rutina sigue las reglas
          de tu nivel.
        </p>
        <p class={styles.counter}>
          {priorities.length} de {max} elegidos
        </p>
        <Tiles
          name="prioridades"
          legend="Músculos prioritarios"
          mode="multi"
          options={muscles.map((m) => ({ value: m, label: m, disabled: full && !priorities.includes(m) }))}
          value={priorities}
          onChange={(next) => onChange(keep({ priorities: next }))}
        />
      </section>

      <section class={styles.block}>
        <h3 class={styles.h3}>Ejercicios opcionales</h3>
        <p class={styles.hint}>
          Marca los que quieres hacer. Los pongo o quito según tus prioridades y tu nivel, pero lo último lo
          decides tú.
        </p>
        <Tiles
          name="opcionales"
          legend="Ejercicios opcionales"
          mode="multi"
          options={optionals.map((o) => ({
            value: o.key,
            label: o.name,
            detail: [o.muscle, o.trimmed ? 'Quitado por el límite de tiempo' : o.reason]
              .filter(Boolean)
              .join(' · '),
          }))}
          value={optionals.filter((o) => o.included).map((o) => o.key)}
          onChange={setOptionals}
        />
      </section>

      <section class={styles.block}>
        <h3 class={styles.h3}>Duración por sesión</h3>
        <p class={styles.hint}>
          Si una sesión pasa de este tiempo, quito el último opcional que no sea prioritario; si no queda
          ninguno, una serie al ejercicio con más series. Sin límite, no toco nada.
        </p>
        <ChoiceChips
          name="minutos"
          legend="Minutos por sesión"
          options={[
            { value: NONE, label: 'Sin límite' },
            ...LIMITS.map((m) => ({ value: String(m), label: m === 75 ? '75 min · normal' : `${m} min` })),
          ]}
          value={minutes === null ? NONE : String(minutes)}
          onChange={(v) => onChange(keep({ maxMinutes: v === NONE ? null : Number(v) }))}
        />
      </section>
    </div>
  )
}
