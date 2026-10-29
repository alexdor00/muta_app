import { useState } from 'preact/hooks'
import { ChoiceList, ChoicePills } from '../../../shared/ui/Choice.tsx'
import styles from './SlotPanel.module.css'

type Option = { en: string; es: string; note?: string }
type Muscle = {
  id: string
  label: string
  group?: 'upper' | 'lower'
  advice: string | null
  e1: Option[]
  e2: Option[]
}

type Common = { id: string }
export type SlotPanelProps = Common &
  (
    | {
        kind: 'optional'
        muscle: string
        /** Por qué entra o no por defecto. */
        reason: string | null
        why: 'rule' | 'hand' | 'time' | null
        off: boolean
        minutes: number | null
        onSet: (include: boolean) => void
        /** Ejercicio original del hueco y los que el documento permite en su lugar. */
        original: string
        options: string[]
        value: string | null
        onPick: (name: string | null) => void
      }
    | {
        kind: 'weak'
        which: 1 | 2
        muscles: Muscle[]
        muscle: string | null
        value: string | null
        onMuscle: (id: string) => void
        onOption: (en: string | null) => void
      }
    | {
        kind: 'pick'
        /** «2 o 3 y siempre los mismos»: la recomendación del programa. */
        recommendation: string
        muscles: Muscle[]
        muscle: string | null
        value: string | null
        onMuscle: (id: string) => void
        onOption: (en: string | null) => void
      }
  )

const NONE = ''
const UNSET = '__sin_elegir'

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const GROUP = { upper: 'Torso', lower: 'Pierna' } as const

/**
 * Búsqueda por grupo muscular: escribes («pec», «glút»…) y salen los músculos que coinciden. Con un músculo
 * elegido y nada escrito, se ve solo ese; al escribir vuelve la lista.
 */
function MuscleSearch(props: {
  id: string
  muscles: Muscle[]
  value: string | null
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const found = props.muscles.filter((m) => plain(m.label).includes(plain(query.trim())))
  const shown = query.trim() || !props.value ? found : props.muscles.filter((m) => m.id === props.value)
  return (
    <div class={styles.search}>
      <input
        class={styles.searchInput}
        type="search"
        placeholder="Buscar grupo muscular"
        aria-label="Buscar grupo muscular"
        value={query}
        onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
      />
      {shown.length ? (
        <ChoiceList
          name={`${props.id}-musculo`}
          legend="Grupo muscular"
          options={shown.map((m) => ({
            value: m.id,
            label: m.label,
            detail: m.group ? GROUP[m.group] : undefined,
          }))}
          value={props.value ?? UNSET}
          onChange={(id) => {
            setQuery('')
            props.onChange(id)
          }}
        />
      ) : (
        <p class={styles.hint}>Ningún grupo muscular coincide.</p>
      )}
    </div>
  )
}

function Options(props: {
  id: string
  options: Option[]
  value: string | null
  skipLabel: string
  onChange: (en: string | null) => void
}) {
  const list = [
    ...props.options.map((o) => ({ value: o.en, label: o.es, detail: o.note })),
    { value: NONE, label: props.skipLabel, detail: undefined },
  ]
  return (
    <ChoiceList
      name={`${props.id}-ejercicio`}
      legend="Ejercicio"
      options={list}
      value={props.value ?? UNSET}
      onChange={(v) => props.onChange(v === NONE ? null : v)}
    />
  )
}

/** Lo que se despliega bajo una fila que se puede cambiar. */
export function SlotPanel(props: SlotPanelProps) {
  if (props.kind === 'optional') {
    const why =
      props.why === 'time'
        ? props.minutes
          ? `Quitado por el límite de ${props.minutes} min por sesión.`
          : 'Quitado por el límite de tiempo.'
        : props.why === 'hand'
          ? 'Lo has decidido tú.'
          : props.reason
    return (
      <div class={styles.panel}>
        <p class={styles.hint}>
          Ejercicio opcional{props.muscle ? ` de ${props.muscle.toLowerCase()}` : ''}. Tú decides si lo haces.
        </p>
        <ChoicePills
          name={`${props.id}-opcional`}
          legend="¿Lo haces?"
          options={[
            { value: 'on', label: 'Hacerlo' },
            { value: 'off', label: 'Quitarlo' },
          ]}
          value={props.off ? 'off' : 'on'}
          onChange={(v) => props.onSet(v === 'on')}
        />
        {why && <p class={styles.note}>{why}</p>}
        {props.options.length > 0 && (
          <ChoiceList
            name={`${props.id}-ejercicio`}
            legend="Ejercicio"
            options={[
              { value: NONE, label: props.original, detail: 'original' },
              ...props.options.map((o) => ({ value: o, label: o, detail: undefined })),
            ]}
            value={props.value ?? NONE}
            onChange={(v) => props.onPick(v === NONE ? null : v)}
          />
        )}
      </div>
    )
  }

  const muscle = props.muscles.find((m) => m.id === props.muscle)
  const options = props.kind === 'weak' && props.which === 2 ? (muscle?.e2 ?? []) : (muscle?.e1 ?? [])
  const title =
    props.kind === 'weak'
      ? props.which === 1
        ? 'Ejercicio 1 de tu punto débil'
        : 'Ejercicio 2 de tu punto débil (solo si ese músculo está recuperado)'
      : 'Punto débil de este día'
  return (
    <div class={styles.panel}>
      <p class={styles.hint}>
        {title}.{' '}
        {props.kind === 'pick'
          ? `${props.recommendation} Elige un músculo y uno de sus ejercicios.`
          : 'Elige un músculo y uno solo de sus ejercicios.'}
      </p>
      <MuscleSearch id={props.id} muscles={props.muscles} value={props.muscle} onChange={props.onMuscle} />
      {muscle?.advice && <p class={styles.note}>{muscle.advice}</p>}
      {muscle && options.length > 0 && (
        <Options
          id={props.id}
          options={options}
          value={props.value}
          skipLabel={props.kind === 'pick' ? 'Dejar este día libre' : 'No añadir'}
          onChange={props.onOption}
        />
      )}
    </div>
  )
}
