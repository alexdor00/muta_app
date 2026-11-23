import { useState } from 'preact/hooks'
import { formatRange, formatRest } from '../../../shared/lib/format.ts'
import { ChevronDownIcon, MinusIcon, PlusIcon, SwapIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { Switch } from '../../../shared/ui/Switch.tsx'
import { ChoiceList } from '../../../shared/ui/Choice.tsx'
import { Desplegable } from './Desplegable.tsx'
import styles from './EditExerciseSheet.module.css'

/** Superserie con el de al lado: ninguno, el anterior o el siguiente (el tipo vive en el dominio). */
type Superserie = 'ninguno' | 'anterior' | 'siguiente'

export type PautaEdicion = {
  series: number
  reps: [number, number]
  rir: number
  /** Segundos. */
  descanso: number
}

/** RIR que se busca al terminar cada serie (repeticiones en reserva): de 0 a 5. */
const MAX_RIR = 5
/** Las repeticiones, mínimo y máximo de 1 en 1 (hasta 50); el descanso, de 15 en 15 s (hasta 5 min). */
const MAX_REPS = 50
const MAX_SERIES = 10
const PASO_DESCANSO = 15
const MAX_DESCANSO = 300

/** Una fila de la pauta: su nombre (y una nota debajo) a la izquierda y − valor + a la derecha. */
function Contador(p: {
  nombre: string
  nota?: string
  texto: string
  puedeMenos: boolean
  puedeMas: boolean
  onPaso: (paso: -1 | 1) => void
}) {
  return (
    <div class={styles.line}>
      <span class={styles.etiqueta}>
        {p.nombre}
        {p.nota && <small class={styles.nota}>{p.nota}</small>}
      </span>
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
 * Editar ejercicio (A12–A14): series, repeticiones (mínimo y máximo), descanso entre series y RIR con − / +, y a la vista
 * «Cada serie distinta» (un rango por serie). Plegado en «Más opciones»: superserie con el de al lado y técnica. Cada toque se guarda solo. Abajo, «Cambiar por otro» y «Quitar».
 */
export function EditExerciseSheet(props: {
  nombre: string
  /** El nombre de la sesión, para volver a ella. */
  sesion: string
  pauta: PautaEdicion
  onCambio: (p: PautaEdicion) => void
  /** Cada serie distinta: el rango de cada una (null: todas iguales). */
  seriesDistintas: [number, number][] | null
  onSeriesDistintas: (s: [number, number][] | null) => void
  /** Superserie con el de al lado: las opciones (ninguno, el anterior, el siguiente) y la elegida. */
  superserie: { opciones: { value: Superserie; label: string }[]; valor: Superserie }
  onSuperserie: (v: Superserie) => void
  /** Técnica de intensidad: las opciones («Ninguna», «Dropset»…), la elegida y qué se hace con ella. */
  tecnica: { opciones: { value: string; label: string }[]; valor: string; explica: string | null }
  onTecnica: (v: string) => void
  onCambiar: () => void
  onQuitar: () => void
  onVolver: () => void
  onClose: () => void
}) {
  const [p, setP] = useState(props.pauta)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [distintas, setDistintas] = useState(props.seriesDistintas)
  // «Más opciones» sale abierto si ya usas alguna
  const [mas, setMas] = useState(props.superserie.valor !== 'ninguno' || props.tecnica.valor !== 'ninguna')
  const ponDistintas = (d: [number, number][] | null) => {
    setDistintas(d)
    props.onSeriesDistintas(d)
  }
  const abre = (k: string) => (a: boolean) => setAbierto(a ? k : null)
  const cambia = (c: Partial<PautaEdicion>) => {
    const nueva = { ...p, ...c }
    setP(nueva)
    props.onCambio(nueva)
  }
  const [min, max] = p.reps
  const superserie =
    props.superserie.opciones.find((o) => o.value === props.superserie.valor)?.label ?? 'Ninguno'
  const tecnica = props.tecnica.opciones.find((o) => o.value === props.tecnica.valor)?.label ?? 'Ninguna'
  return (
    <Sheet
      alta
      title={props.nombre}
      onClose={props.onClose}
      large
      atras={{ label: props.sesion, onClick: props.onVolver }}
    >
      <section class={styles.card} aria-label="Pauta">
        <Contador
          nombre="Series"
          texto={String(p.series)}
          puedeMenos={p.series > 1}
          puedeMas={p.series < MAX_SERIES}
          onPaso={(paso) => {
            const series = p.series + paso
            cambia({ series })
            // Con cada serie distinta, una más (como la última) o una menos
            if (distintas)
              ponDistintas(
                Array.from({ length: series }, (_, k) => distintas[k] ?? distintas[distintas.length - 1]),
              )
          }}
        />
        {/* A la vista, no en «Más opciones»: con él, cada serie lleva sus repeticiones */}
        <div class={styles.line}>
          <span class={styles.etiqueta}>
            Cada serie distinta
            <small class={styles.nota}>Repeticiones diferentes en cada serie</small>
          </span>
          <Switch
            checked={Boolean(distintas)}
            label="Cada serie distinta"
            onChange={(on) => ponDistintas(on ? Array.from({ length: p.series }, () => p.reps) : null)}
          />
        </div>
        {distintas ? (
          distintas.map((r, k) => (
            <Desplegable
              key={k}
              titulo={`Serie ${k + 1}`}
              valor={`${formatRange(r)} reps`}
              abierto={abierto === `serie${k}`}
              onAbrir={abre(`serie${k}`)}
            >
              <Contador
                nombre={`Mínimo de reps de la serie ${k + 1}`}
                texto={String(r[0])}
                puedeMenos={r[0] > 1}
                puedeMas={r[0] < r[1]}
                onPaso={(paso) => ponDistintas(distintas.map((x, m) => (m === k ? [x[0] + paso, x[1]] : x)))}
              />
              <Contador
                nombre={`Máximo de reps de la serie ${k + 1}`}
                texto={String(r[1])}
                puedeMenos={r[1] > r[0]}
                puedeMas={r[1] < MAX_REPS}
                onPaso={(paso) => ponDistintas(distintas.map((x, m) => (m === k ? [x[0], x[1] + paso] : x)))}
              />
            </Desplegable>
          ))
        ) : (
          <>
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
          </>
        )}
        <Contador
          nombre="Descanso entre series"
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
        <Contador
          nombre="RIR"
          nota={p.rir === 0 ? 'Hasta el fallo' : `Terminas con ${p.rir} en reserva`}
          texto={String(p.rir)}
          puedeMenos={p.rir > 0}
          puedeMas={p.rir < MAX_RIR}
          onPaso={(paso) => cambia({ rir: p.rir + paso })}
        />
      </section>

      <button
        type="button"
        class={styles.mas}
        aria-expanded={mas}
        aria-controls="mas-opciones"
        onClick={() => setMas(!mas)}
      >
        Más opciones
        <ChevronDownIcon />
      </button>
      {mas && (
        <section id="mas-opciones" class={styles.card} aria-label="Más opciones">
          {props.superserie.opciones.length > 1 && (
            <Desplegable
              titulo="Superserie con"
              valor={superserie}
              abierto={abierto === 'superserie'}
              onAbrir={abre('superserie')}
            >
              <small class={styles.hint}>
                Se hacen alternos: 20 s entre los dos y el descanso al terminar la pareja.
              </small>
              <ChoiceList
                name="superserie"
                legend="Superserie con"
                options={props.superserie.opciones}
                value={props.superserie.valor}
                onChange={(v) => {
                  props.onSuperserie(v)
                  setAbierto(null)
                }}
              />
            </Desplegable>
          )}
          <Desplegable
            titulo="Técnica"
            valor={tecnica}
            abierto={abierto === 'tecnica'}
            onAbrir={abre('tecnica')}
          >
            <small class={styles.hint}>
              {props.tecnica.explica && `${props.tecnica.explica} `}
              Mejor en la última serie del último ejercicio de un músculo.
            </small>
            <ChoiceList
              name="tecnica"
              legend="Técnica"
              options={props.tecnica.opciones}
              value={props.tecnica.valor}
              onChange={(v) => {
                props.onTecnica(v)
                setAbierto(null)
              }}
            />
          </Desplegable>
        </section>
      )}

      <div class={styles.botones}>
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
