import { ChoiceCards } from '../../../shared/ui/Choice.tsx'
import { Tiles } from '../../../shared/ui/Tiles.tsx'
import styles from './WeakPointPicker.module.css'

type Option = { en: string; es: string; note?: string }
type Muscle = {
  id: string
  label: string
  group?: 'upper' | 'lower'
  advice: string | null
  e1: Option[]
  e2: Option[]
}
export type WeakTableView =
  { mode: 'table'; muscles: Muscle[] } | { mode: 'pick'; min: number; max: number; muscles: Muscle[] }
export type WeakChoiceView =
  | { mode: 'table'; muscle: string; e1: string | null; e2: string | null }
  | { mode: 'pick'; picks: { muscle: string; option: string }[] }

type Props = {
  table: WeakTableView
  choice: WeakChoiceView | null
  /** El ejercicio 1 se puede dejar sin elegir. */
  e1Optional: boolean
  onChange: (choice: WeakChoiceView) => void
}

const NONE = ''
const count = (n: number) => `${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`
const UNSET = '__sin_elegir'

function Badge(props: { required: boolean }) {
  return (
    <span class={`${styles.badge} ${props.required ? styles.required : ''}`}>
      {props.required ? 'Obligatorio' : 'Opcional'}
    </span>
  )
}

function Options(props: {
  name: string
  legend: string
  options: Option[]
  value: string | null
  /** Con permiso de no elegir: añade «No añadir». */
  skippable: boolean
  onChange: (value: string | null) => void
}) {
  const cards = props.options.map((o, i) => ({
    value: o.en,
    label: o.es,
    detail: o.note,
    icon: String(i + 1),
  }))
  if (props.skippable)
    cards.push({ value: NONE, label: 'No añadir', detail: 'Lo dejo para otra vez', icon: '–' })
  return (
    <ChoiceCards
      name={props.name}
      legend={props.legend}
      options={cards}
      value={props.value ?? (props.skippable ? NONE : UNSET)}
      onChange={(v) => props.onChange(v === NONE ? null : v)}
    />
  )
}

/** Un músculo y, de su tabla, un ejercicio 1 y, si quieres, un ejercicio 2 (Culturismo). */
function TablePicker({
  table,
  choice,
  e1Optional,
  onChange,
}: Props & { table: { mode: 'table'; muscles: Muscle[] } }) {
  const current = choice?.mode === 'table' ? choice : null
  const muscle = table.muscles.find((m) => m.id === current?.muscle)
  return (
    <div class={styles.picker}>
      <section class={styles.block}>
        <h3 class={styles.h3}>¿Cuál es tu punto débil?</h3>
        <p class={styles.hint}>
          El músculo que más quieres mejorar: los huecos de la rutina se llenan con ejercicios suyos.
        </p>
        <Tiles
          name="musculo"
          legend="Músculo"
          options={table.muscles.map((m) => ({
            value: m.id,
            label: m.label,
            detail: m.e1.length ? count(m.e1.length) : 'Consejo',
          }))}
          value={current ? [current.muscle] : []}
          onChange={([id]) => onChange({ mode: 'table', muscle: id, e1: null, e2: null })}
        />
      </section>

      {muscle?.advice && <p class={styles.advice}>{muscle.advice}</p>}

      {muscle && muscle.e1.length > 0 && current && (
        <section class={styles.block}>
          <h3 class={styles.h3}>
            Ejercicio 1 <Badge required={!e1Optional} />
          </h3>
          <p class={styles.hint}>Elige uno solo; no los hagas todos el mismo día.</p>
          <Options
            name="ejercicio-1"
            legend="Ejercicio 1"
            options={muscle.e1}
            value={current.e1}
            skippable={e1Optional}
            onChange={(e1) => onChange({ ...current, e1 })}
          />
        </section>
      )}

      {muscle && muscle.e2.length > 0 && current && (
        <section class={styles.block}>
          <h3 class={styles.h3}>
            Ejercicio 2 <Badge required={false} />
          </h3>
          <p class={styles.hint}>
            Solo si tu punto débil se siente recuperado; si está cansado o dolorido, sáltalo.
          </p>
          <Options
            name="ejercicio-2"
            legend="Ejercicio 2"
            options={muscle.e2}
            value={current.e2}
            skippable
            onChange={(e2) => onChange({ ...current, e2 })}
          />
        </section>
      )}
    </div>
  )
}

/** Entre 2 y 3 músculos y un ejercicio de cada uno, para todo el programa (Torso y pierna). */
function PickPicker({
  table,
  choice,
  onChange,
}: Props & { table: { mode: 'pick'; min: number; max: number; muscles: Muscle[] } }) {
  const picks = choice?.mode === 'pick' ? choice.picks : []
  const full = picks.length >= table.max
  const chosen = new Set(picks.map((p) => p.muscle))
  const tiles = (group: 'upper' | 'lower', legend: string) => (
    <Tiles
      name={`grupo-${group}`}
      legend={legend}
      showLegend
      mode="multi"
      options={table.muscles
        .filter((m) => m.group === group)
        .map((m) => ({
          value: m.id,
          label: m.label,
          detail: count(m.e1.length),
          disabled: full && !chosen.has(m.id),
        }))}
      value={picks
        .map((p) => p.muscle)
        .filter((id) => table.muscles.find((m) => m.id === id)?.group === group)}
      onChange={(ids) => {
        const others = picks.filter((p) => table.muscles.find((m) => m.id === p.muscle)?.group !== group)
        const mine = ids.map((id) => picks.find((p) => p.muscle === id) ?? { muscle: id, option: NONE })
        onChange({ mode: 'pick', picks: [...others, ...mine] })
      }}
    />
  )
  return (
    <div class={styles.picker}>
      <section class={styles.block}>
        <h3 class={styles.h3}>
          Elige {table.min} o {table.max} puntos débiles <Badge required />
        </h3>
        <p class={styles.hint}>
          Al menos uno de torso y uno de pierna, y sé constante: mantén los mismos todo el programa para no
          entrenar solo lo que más te gusta.
        </p>
        <p class={styles.counter}>
          {picks.length} de {table.max} elegidos
        </p>
      </section>
      <section class={styles.block}>{tiles('upper', 'Torso')}</section>
      <section class={styles.block}>{tiles('lower', 'Pierna')}</section>

      {picks.map((p) => {
        const m = table.muscles.find((x) => x.id === p.muscle)
        if (!m) return null
        return (
          <section key={p.muscle} class={styles.block}>
            <h3 class={styles.h3}>{m.label}</h3>
            <p class={styles.hint}>Elige uno de estos ejercicios.</p>
            <Options
              name={`ejercicio-${p.muscle}`}
              legend={`Ejercicio de ${m.label}`}
              options={m.e1}
              value={p.option || null}
              skippable={false}
              onChange={(option) =>
                onChange({
                  mode: 'pick',
                  picks: picks.map((x) => (x.muscle === p.muscle ? { ...x, option: option ?? NONE } : x)),
                })
              }
            />
          </section>
        )
      })}
    </div>
  )
}

/** Selector de punto débil: el contenido de la hoja «Tu punto débil». */
export function WeakPointPicker(props: Props) {
  return props.table.mode === 'table' ? (
    <TablePicker {...props} table={props.table} />
  ) : (
    <PickPicker {...props} table={props.table} />
  )
}
