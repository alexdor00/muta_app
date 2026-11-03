import { useState } from 'preact/hooks'
import { formatClock, formatDecimal, formatRange } from '../../../shared/lib/format.ts'
import { Button } from '../../../shared/ui/Button.tsx'
import { ChoiceChips } from '../../../shared/ui/Choice.tsx'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  MinusIcon,
  PlusIcon,
  SwapIcon,
  TrashIcon,
} from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { DESCANSOS } from './WorkoutSheets.tsx'
import styles from './EditExerciseSheet.module.css'

export type PautaEdicion = {
  series: number
  reps: [number, number]
  rir: number
  salto: number
  nota: string
  /** Segundos. */
  descanso: number
}

const QUEDAN = [
  { value: '0', label: 'Al fallo' },
  { value: '1', label: 'Queda 1' },
  { value: '2', label: 'Quedan 2' },
  { value: '3', label: 'Quedan 3' },
]
const SALTOS = [1, 1.25, 2, 2.5, 4, 5, 10]

function Contador(p: {
  nombre: string
  valor: number
  min: number
  max: number
  onCambio: (v: number) => void
}) {
  return (
    <div class={styles.counter}>
      <button
        type="button"
        aria-label={`${p.nombre}: menos`}
        disabled={p.valor <= p.min}
        onClick={() => p.onCambio(p.valor - 1)}
      >
        <MinusIcon />
      </button>
      <b aria-label={p.nombre}>{p.valor}</b>
      <button
        type="button"
        aria-label={`${p.nombre}: más`}
        disabled={p.valor >= p.max}
        onClick={() => p.onCambio(p.valor + 1)}
      >
        <PlusIcon />
      </button>
    </div>
  )
}

/**
 * Editar ejercicio (A12–A13): series, repeticiones, lo que queda al terminar la serie y descanso; en «Más opciones», salto
 * de peso, nota, copiar a otra sesión y subir o bajar un puesto. Cambiar por otro, quitar y «Guardar cambios».
 */
export function EditExerciseSheet(props: {
  nombre: string
  /** Músculo y material («Pecho», «Mancuerna»). */
  chips: string[]
  pauta: PautaEdicion
  otrasSesiones: { value: string; label: string }[]
  puedeSubir: boolean
  puedeBajar: boolean
  onGuardar: (p: PautaEdicion) => void
  onCambiar: () => void
  onQuitar: () => void
  onCopiar: (sigla: string) => void
  onMover: (paso: -1 | 1) => void
  onVolver: () => void
  onClose: () => void
}) {
  const [p, setP] = useState(props.pauta)
  const [copiar, setCopiar] = useState(false)
  const cambia = (c: Partial<PautaEdicion>) => setP({ ...p, ...c })
  const [min, max] = p.reps
  const queda = p.rir <= 0 ? 'al fallo' : `a ${p.rir} del fallo`
  return (
    <Sheet
      title={props.nombre}
      onClose={props.onClose}
      large
      footer={<Button onClick={() => props.onGuardar(p)}>Guardar cambios</Button>}
    >
      <div class={styles.top}>
        <button type="button" class={styles.back} onClick={props.onVolver}>
          <ChevronLeftIcon />
          Rutina
        </button>
        <ul class={styles.chips}>
          {props.chips.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
      <p class={styles.summary}>
        {p.series} series de {formatRange(p.reps)} reps, {queda}
      </p>

      <section class={styles.card} aria-label="Pauta">
        <div class={styles.line}>
          <span>Series</span>
          <Contador
            nombre="Series"
            valor={p.series}
            min={1}
            max={10}
            onCambio={(series) => cambia({ series })}
          />
        </div>
        <div class={styles.line}>
          <span>Repeticiones</span>
          <span class={styles.pair}>
            <Contador
              nombre="Mínimo de repeticiones"
              valor={min}
              min={1}
              max={max}
              onCambio={(v) => cambia({ reps: [v, max] })}
            />
            <small>a</small>
            <Contador
              nombre="Máximo de repeticiones"
              valor={max}
              min={min}
              max={50}
              onCambio={(v) => cambia({ reps: [min, v] })}
            />
          </span>
        </div>
        <div class={styles.block}>
          <span>Al terminar la serie</span>
          <small>Cuántas repeticiones más podrías hacer</small>
          <ChoiceChips
            name="quedan"
            legend="Al terminar la serie"
            options={QUEDAN}
            value={String(Math.min(3, p.rir))}
            onChange={(v) => cambia({ rir: Number(v) })}
          />
        </div>
      </section>

      <section class={styles.card} aria-label="Descanso">
        <span>Descanso</span>
        <div class={styles.options} role="group" aria-label="Descanso entre series">
          {DESCANSOS.map((s) => (
            <button
              key={s}
              type="button"
              class={styles.option}
              aria-pressed={s === p.descanso}
              onClick={() => cambia({ descanso: s })}
            >
              {formatClock(s)}
            </button>
          ))}
        </div>
      </section>

      <details class={styles.more}>
        <summary>
          Más opciones
          <ChevronDownIcon />
        </summary>
        <span class={styles.label}>Salto de peso</span>
        <small class={styles.hint}>Cuánto subes cada vez</small>
        <div class={styles.options} role="group" aria-label="Salto de peso">
          {SALTOS.map((s) => (
            <button
              key={s}
              type="button"
              class={styles.option}
              aria-pressed={s === p.salto}
              onClick={() => cambia({ salto: s })}
            >
              {formatDecimal(s)} kg
            </button>
          ))}
        </div>
        <label class={styles.label}>
          Nota
          <textarea
            class={styles.note}
            value={p.nota}
            placeholder="Agarre, agujero, en el descanso de…"
            onInput={(e) => cambia({ nota: e.currentTarget.value })}
          />
        </label>
        <div class={styles.actions}>
          <button
            type="button"
            class={styles.action}
            disabled={!props.puedeSubir}
            onClick={() => props.onMover(-1)}
          >
            <ArrowUpIcon />
            Subir un puesto
          </button>
          <button
            type="button"
            class={styles.action}
            disabled={!props.puedeBajar}
            onClick={() => props.onMover(1)}
          >
            <ArrowDownIcon />
            Bajar un puesto
          </button>
          {props.otrasSesiones.length > 0 && (
            <button
              type="button"
              class={styles.action}
              aria-expanded={copiar}
              onClick={() => setCopiar(!copiar)}
            >
              <PlusIcon />
              Copiar a otra sesión
            </button>
          )}
          {copiar && (
            <div class={styles.options} role="group" aria-label="Copiar a">
              {props.otrasSesiones.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  class={styles.option}
                  onClick={() => props.onCopiar(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </details>

      <div class={styles.actions}>
        <button type="button" class={styles.action} onClick={props.onCambiar}>
          <SwapIcon />
          Cambiar por otro ejercicio
        </button>
        <button type="button" class={`${styles.action} ${styles.danger}`} onClick={props.onQuitar}>
          <TrashIcon />
          Quitar de la rutina
        </button>
      </div>
    </Sheet>
  )
}
