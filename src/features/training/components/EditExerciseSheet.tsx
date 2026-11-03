import { useState } from 'preact/hooks'
import { formatClock, formatRange } from '../../../shared/lib/format.ts'
import { ChoiceList } from '../../../shared/ui/Choice.tsx'
import { ChevronDownIcon, ChevronLeftIcon, MinusIcon, PlusIcon, SwapIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { ConsejoEntrenador } from './EditRoutineSheet.tsx'
import styles from './EditExerciseSheet.module.css'

export type PautaEdicion = {
  series: number
  reps: [number, number]
  rir: number
  /** Segundos. */
  descanso: number
}

const QUEDAN = [
  { value: '0', label: 'Al fallo' },
  { value: '1', label: 'Queda 1' },
  { value: '2', label: 'Quedan 2' },
  { value: '3', label: 'Quedan 3' },
]
/** El rango de repeticiones se mueve entero, de 2 en 2; el descanso, de 15 en 15 s (hasta 5 min). */
const PASO_REPS = 2
const PASO_DESCANSO = 15
const MAX_DESCANSO = 300

function Contador(p: {
  nombre: string
  texto: string
  puedeMenos: boolean
  puedeMas: boolean
  onPaso: (paso: -1 | 1) => void
}) {
  return (
    <div class={styles.line}>
      <span>{p.nombre}</span>
      <span class={styles.counter}>
        <button
          type="button"
          aria-label={`${p.nombre}: menos`}
          disabled={!p.puedeMenos}
          onClick={() => p.onPaso(-1)}
        >
          <MinusIcon />
        </button>
        <b aria-label={p.nombre}>{p.texto}</b>
        <button
          type="button"
          aria-label={`${p.nombre}: más`}
          disabled={!p.puedeMas}
          onClick={() => p.onPaso(1)}
        >
          <PlusIcon />
        </button>
      </span>
    </div>
  )
}

/**
 * Editar ejercicio (A12–A13): series, repeticiones y descanso con − / +, y «Al terminar la serie» en una lista plegada.
 * Cada toque se guarda solo. Un consejo del entrenador como mucho; «Cambiar por otro» y «Quitar».
 */
export function EditExerciseSheet(props: {
  nombre: string
  /** El nombre de la sesión, para volver a ella. */
  sesion: string
  pauta: PautaEdicion
  consejo: string | null
  onVale: () => void
  onCambio: (p: PautaEdicion) => void
  onCambiar: () => void
  onQuitar: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const [p, setP] = useState(props.pauta)
  const cambia = (c: Partial<PautaEdicion>) => {
    const nueva = { ...p, ...c }
    setP(nueva)
    props.onCambio(nueva)
  }
  const [min, max] = p.reps
  const quedan = QUEDAN[Math.min(3, Math.max(0, p.rir))]
  return (
    <Sheet title={props.nombre} onClose={props.onClose} large>
      <button type="button" class={styles.back} onClick={props.onVolver}>
        <ChevronLeftIcon />
        {props.sesion}
      </button>

      <section class={styles.card} aria-label="Pauta">
        <Contador
          nombre="Series"
          texto={String(p.series)}
          puedeMenos={p.series > 1}
          puedeMas={p.series < 10}
          onPaso={(paso) => cambia({ series: p.series + paso })}
        />
        <Contador
          nombre="Repeticiones"
          texto={formatRange(p.reps)}
          puedeMenos={min - PASO_REPS >= 1}
          puedeMas={max + PASO_REPS <= 50}
          onPaso={(paso) => cambia({ reps: [min + paso * PASO_REPS, max + paso * PASO_REPS] })}
        />
        <Contador
          nombre="Descanso"
          texto={formatClock(p.descanso)}
          puedeMenos={p.descanso > PASO_DESCANSO}
          puedeMas={p.descanso < MAX_DESCANSO}
          onPaso={(paso) =>
            cambia({
              descanso: Math.min(
                MAX_DESCANSO,
                Math.max(
                  PASO_DESCANSO,
                  Math.round(p.descanso / PASO_DESCANSO) * PASO_DESCANSO + paso * PASO_DESCANSO,
                ),
              ),
            })
          }
        />
        <details class={styles.more}>
          <summary>
            <span>Al terminar la serie</span>
            <span class={styles.value}>
              {quedan.label}
              <ChevronDownIcon />
            </span>
          </summary>
          <small class={styles.hint}>Cuántas repeticiones más podrías hacer</small>
          <ChoiceList
            name="quedan"
            legend="Al terminar la serie"
            options={QUEDAN}
            value={quedan.value}
            onChange={(v) => cambia({ rir: Number(v) })}
          />
        </details>
      </section>

      {props.consejo && <ConsejoEntrenador texto={props.consejo} onVale={props.onVale} />}

      <div class={styles.links}>
        <button type="button" onClick={props.onCambiar}>
          <SwapIcon />
          Cambiar por otro
        </button>
        <button type="button" class={styles.danger} onClick={props.onQuitar}>
          Quitar
        </button>
      </div>
    </Sheet>
  )
}
