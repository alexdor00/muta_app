import { Tiles } from '../../../shared/ui/Tiles.tsx'
import styles from './WeakPointPicker.module.css'

type OptionalView = {
  key: string
  name: string
  muscle: string
  days: string[]
  included: boolean
  reason: string | null
}
export type PriorityChoiceView = { priorities: string[]; optionals: Record<string, boolean> }

type Props = {
  muscles: string[]
  optionals: OptionalView[]
  choice: PriorityChoiceView | null
  max: number
  onChange: (choice: PriorityChoiceView) => void
}

/** Prioridades (máx. 4) y ejercicios opcionales a tu gusto: el contenido de la hoja «Tus prioridades». */
export function PriorityPicker({ muscles, optionals, choice, max, onChange }: Props) {
  const priorities = choice?.priorities ?? []
  const overrides = choice?.optionals ?? {}
  const full = priorities.length >= max

  function setOptionals(keys: string[]) {
    const on = new Set(keys)
    const next = { ...overrides }
    for (const o of optionals) if (on.has(o.key) !== o.included) next[o.key] = on.has(o.key)
    onChange({ priorities, optionals: next })
  }

  return (
    <div class={styles.picker}>
      <section class={styles.block}>
        <h3 class={styles.h3}>
          Tus prioridades <span class={styles.badge}>Opcional</span>
        </h3>
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
          onChange={(next) => onChange({ priorities: next, optionals: overrides })}
        />
      </section>

      <section class={styles.block}>
        <h3 class={styles.h3}>
          Ejercicios opcionales <span class={styles.badge}>Tú decides</span>
        </h3>
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
            detail: [o.muscle, o.reason].filter(Boolean).join(' · '),
          }))}
          value={optionals.filter((o) => o.included).map((o) => o.key)}
          onChange={setOptionals}
        />
      </section>
    </div>
  )
}
