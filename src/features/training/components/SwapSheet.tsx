import { useState } from 'preact/hooks'
import { ChoiceSegmented } from '../../../shared/ui/Choice.tsx'
import { ChevronRightIcon, InfoIcon, SearchIcon } from '../../../shared/ui/icons.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'
import styles from './WorkoutSheets.module.css'

export type Alcance = 'hoy' | 'plan'

const ALCANCES: { value: Alcance; label: string }[] = [
  { value: 'hoy', label: 'Solo hoy' },
  { value: 'plan', label: 'En mi plan' },
]

/** Una fila de la hoja: el nombre y, si hay, por qué se propone. */
function FilaCambio(props: { titulo: string; detalle?: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" class={styles.option} onClick={props.onClick}>
        <span class={styles.text}>
          <span class={styles.title}>{props.titulo}</span>
          {props.detalle && <span class={styles.detail}>{props.detalle}</span>}
        </span>
        <span class={styles.chevron} aria-hidden="true">
          <ChevronRightIcon />
        </span>
      </button>
    </li>
  )
}

/**
 * Cambiar el ejercicio (C12): solo hoy o en tu plan (las próximas veces, con la pauta de la rutina). Primero los que hacen
 * lo mismo (mismo músculo y zona, con el porqué), luego las sustituciones del programa y, si lo cambiaste en tu plan,
 * volver al de la rutina.
 */
export function SwapSheet(props: {
  equivalentes: { nombre: string; motivo: string }[]
  sustitutos: string[]
  /** El de la rutina, si en tu plan lo cambiaste por otro. */
  enLugarDe: string | null
  onElegir: (nombre: string, alcance: Alcance) => void
  /** «Elegir cualquier ejercicio»: la biblioteca, filtrada por su músculo (sesion-en-vivo.js · v7-swap-any). */
  onBiblioteca: (alcance: Alcance) => void
  /** Desde Editar rutina: siempre en tu plan, sin elegir. */
  soloPlan?: boolean
  onClose: () => void
}) {
  const [alcance, setAlcance] = useState<Alcance>(props.soloPlan ? 'plan' : 'hoy')
  const { equivalentes, sustitutos } = props
  return (
    <Sheet title="Cambiar ejercicio" onClose={props.onClose} large>
      {!props.soloPlan && (
        <ChoiceSegmented
          grande
          name="alcance-cambio"
          legend="Dónde se cambia"
          options={ALCANCES}
          value={alcance}
          onChange={setAlcance}
        />
      )}
      {/* El aviso, corto y en su tarjeta */}
      <p class={styles.swapAviso}>
        <InfoIcon />
        <span>¿Molestias o estancado? Revisa la técnica antes de cambiarlo.</span>
      </p>
      {props.enLugarDe && (
        <ul class={`${styles.options} ${styles.swapCard}`}>
          <FilaCambio
            titulo={`Volver a ${props.enLugarDe}`}
            detalle="El de tu rutina"
            onClick={() => props.onElegir(props.enLugarDe ?? '', alcance)}
          />
        </ul>
      )}
      {equivalentes.length > 0 && (
        <>
          <h3 class={styles.swapTitulo}>Hacen lo mismo</h3>
          <ul class={`${styles.options} ${styles.swapCard}`}>
            {equivalentes.map((e) => (
              <FilaCambio
                key={e.nombre}
                titulo={e.nombre}
                detalle={e.motivo}
                onClick={() => props.onElegir(e.nombre, alcance)}
              />
            ))}
          </ul>
        </>
      )}
      {sustitutos.length > 0 && (
        <>
          <h3 class={styles.swapTitulo}>Los que da tu programa</h3>
          <ul class={`${styles.options} ${styles.swapCard}`}>
            {sustitutos.map((s) => (
              <FilaCambio key={s} titulo={s} onClick={() => props.onElegir(s, alcance)} />
            ))}
          </ul>
        </>
      )}
      {!equivalentes.length && !sustitutos.length && (
        <p class={styles.lead}>No hay otro que haga lo mismo: elige uno de la biblioteca.</p>
      )}
      <button type="button" class={styles.anyExercise} onClick={() => props.onBiblioteca(alcance)}>
        <SearchIcon />
        Elegir cualquier ejercicio
      </button>
    </Sheet>
  )
}
