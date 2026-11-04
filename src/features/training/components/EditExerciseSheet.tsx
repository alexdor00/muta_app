import { useState } from 'preact/hooks'
import { formatRange, formatRest } from '../../../shared/lib/format.ts'
import { ChoiceList } from '../../../shared/ui/Choice.tsx'
import { ChevronLeftIcon, MinusIcon, PlusIcon, SwapIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { Desplegable } from './Desplegable.tsx'
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
/** Las repeticiones, mínimo y máximo de 1 en 1 (hasta 50); el descanso, de 15 en 15 s (hasta 5 min). */
const MAX_REPS = 50
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
 * Editar ejercicio (A12–A13): series y descanso con − / +; repeticiones (mínimo y máximo) y «Al terminar la serie»,
 * desplegables.
 * Cada toque se guarda solo. «Cambiar por otro» y «Quitar».
 */
export function EditExerciseSheet(props: {
  nombre: string
  /** El nombre de la sesión, para volver a ella. */
  sesion: string
  pauta: PautaEdicion
  onCambio: (p: PautaEdicion) => void
  onCambiar: () => void
  onQuitar: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const [p, setP] = useState(props.pauta)
  // Un desplegable abierto cada vez: repeticiones o «Al terminar la serie»
  const [abierto, setAbierto] = useState<'reps' | 'quedan' | null>(null)
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
        <Desplegable
          titulo="Repeticiones"
          valor={formatRange(p.reps)}
          abierto={abierto === 'reps'}
          onAbrir={(a) => setAbierto(a ? 'reps' : null)}
        >
          <Contador
            nombre="Mínimo de reps"
            texto={String(min)}
            puedeMenos={min > 1}
            puedeMas={min < max}
            onPaso={(paso) => cambia({ reps: [min + paso, max] })}
          />
          <Contador
            nombre="Máximo de reps"
            texto={String(max)}
            puedeMenos={max > min}
            puedeMas={max < MAX_REPS}
            onPaso={(paso) => cambia({ reps: [min, max + paso] })}
          />
        </Desplegable>
        <Contador
          nombre="Descanso"
          texto={formatRest(p.descanso)}
          puedeMenos={p.descanso > 0}
          puedeMas={p.descanso < MAX_DESCANSO}
          onPaso={(paso) =>
            cambia({
              descanso: Math.min(
                MAX_DESCANSO,
                Math.max(0, Math.round(p.descanso / PASO_DESCANSO) * PASO_DESCANSO + paso * PASO_DESCANSO),
              ),
            })
          }
        />
        <Desplegable
          titulo="Al terminar la serie"
          valor={quedan.label}
          abierto={abierto === 'quedan'}
          onAbrir={(a) => setAbierto(a ? 'quedan' : null)}
        >
          <small class={styles.hint}>Cuántas repeticiones más podrías hacer</small>
          <ChoiceList
            name="quedan"
            legend="Al terminar la serie"
            options={QUEDAN}
            value={quedan.value}
            onChange={(v) => cambia({ rir: Number(v) })}
          />
        </Desplegable>
      </section>

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
