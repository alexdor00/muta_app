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
  | { mode: 'pick'; picks: { muscle: string; option: string }[]; slots?: Record<string, string[]> }

type Props = {
  table: WeakTableView
  choice: WeakChoiceView | null
  /** Días con hueco de «elige tus músculos» (Torso y pierna). */
  slots: { key: string; side: 'upper' | 'lower' }[]
  /** Reparto que se aplica si no lo cambias. */
  auto: Record<string, string[]>
  onChange: (choice: WeakChoiceView) => void
}

const NONE = ''
const UNSET = '__sin_elegir'
const count = (n: number) => `${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`

function Badge() {
  return <span class={styles.badge}>Opcional</span>
}

/** Tarjetas de ejercicios; «No añadir» deja el hueco libre. */
function Options(props: {
  name: string
  legend: string
  options: Option[]
  value: string | null
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
function TablePicker({ table, choice, onChange }: Props & { table: { mode: 'table'; muscles: Muscle[] } }) {
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
            Ejercicio 1 <Badge />
          </h3>
          <p class={styles.hint}>Elige uno solo; no los hagas todos el mismo día.</p>
          <Options
            name="ejercicio-1"
            legend="Ejercicio 1"
            options={muscle.e1}
            value={current.e1}
            skippable
            onChange={(e1) => onChange({ ...current, e1 })}
          />
        </section>
      )}

      {muscle && muscle.e2.length > 0 && current && (
        <section class={styles.block}>
          <h3 class={styles.h3}>
            Ejercicio 2 <Badge />
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

/** Los músculos que quieras, un ejercicio de cada uno y en qué día va cada uno (Torso y pierna). */
function PickPicker({
  table,
  choice,
  slots,
  auto,
  onChange,
}: Props & { table: { mode: 'pick'; min: number; max: number; muscles: Muscle[] } }) {
  const picks = choice?.mode === 'pick' ? choice.picks : []
  const given = choice?.mode === 'pick' ? choice.slots : undefined
  const chosen = new Set(picks.map((p) => p.muscle))
  const label = (id: string) => table.muscles.find((m) => m.id === id)?.label ?? id

  // El reparto que has tocado se conserva, sin los músculos que ya no están elegidos
  const change = (next: { muscle: string; option: string }[], slotsNext = given) => {
    const keep = new Set(next.map((p) => p.muscle))
    onChange({
      mode: 'pick',
      picks: next,
      slots:
        slotsNext &&
        Object.fromEntries(
          Object.entries(slotsNext).map(([k, ids]) => [k, ids.filter((id) => keep.has(id))]),
        ),
    })
  }

  const tiles = (group: 'upper' | 'lower', legend: string) => (
    <Tiles
      name={`grupo-${group}`}
      legend={legend}
      showLegend
      mode="multi"
      options={table.muscles
        .filter((m) => m.group === group)
        .map((m) => ({ value: m.id, label: m.label, detail: count(m.e1.length) }))}
      value={picks
        .map((p) => p.muscle)
        .filter((id) => table.muscles.find((m) => m.id === id)?.group === group)}
      onChange={(ids) => {
        const others = picks.filter((p) => table.muscles.find((m) => m.id === p.muscle)?.group !== group)
        const mine = ids.map((id) => picks.find((p) => p.muscle === id) ?? { muscle: id, option: NONE })
        change([...others, ...mine], undefined) // al cambiar los músculos, el reparto vuelve a ser automático
      }}
    />
  )

  return (
    <div class={styles.picker}>
      <section class={styles.block}>
        <h3 class={styles.h3}>
          Elige tus puntos débiles <Badge />
        </h3>
        <p class={styles.hint}>
          El programa recomienda {table.min} o {table.max} y que sean siempre los mismos, para no entrenar
          solo lo que más te gusta.
        </p>
        <p class={styles.counter}>{picks.length} elegidos</p>
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
                change(picks.map((x) => (x.muscle === p.muscle ? { ...x, option: option ?? NONE } : x)))
              }
            />
          </section>
        )
      })}

      {picks.length > 0 && slots.length > 0 && (
        <section class={styles.block}>
          <h3 class={styles.h3}>¿En qué día?</h3>
          <p class={styles.hint}>
            Ya los he repartido; cámbialo como quieras. Si marcas varios en un día, se alternan por semana;
            sin marcar ninguno, ese día queda libre.
          </p>
          {slots.map((slot) => (
            <Tiles
              key={slot.key}
              name={`dia-${slot.key}`}
              legend={slot.key}
              showLegend
              mode="multi"
              options={picks.map((p) => ({ value: p.muscle, label: label(p.muscle) }))}
              value={(given ?? auto)[slot.key]?.filter((id) => chosen.has(id)) ?? []}
              onChange={(ids) => change(picks, { ...(given ?? auto), [slot.key]: ids })}
            />
          ))}
        </section>
      )}
    </div>
  )
}

/** Selector de punto débil: el contenido de la hoja «Antes de empezar». */
export function WeakPointPicker(props: Props) {
  return props.table.mode === 'table' ? (
    <TablePicker {...props} table={props.table} />
  ) : (
    <PickPicker {...props} table={props.table} />
  )
}
