import { useState } from 'preact/hooks'
import { ChoiceSegmented } from '../../../shared/ui/Choice.tsx'
import { ChevronRightIcon, SearchIcon } from '../../../shared/ui/icons.tsx'
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
  onClose: () => void
}) {
  const [alcance, setAlcance] = useState<Alcance>('hoy')
  return (
    <Sheet title="Cambiar ejercicio" onClose={props.onClose} large>
      <ChoiceSegmented
        name="alcance-cambio"
        legend="Dónde se cambia"
        options={ALCANCES}
        value={alcance}
        onChange={setAlcance}
      />
      <p class={styles.lead}>
        {alcance === 'hoy'
          ? 'Solo cambia en esta sesión; tu plan sigue igual.'
          : 'Cambia en tu plan las próximas veces, con las mismas series, repeticiones y descanso.'}
      </p>
      {props.enLugarDe && (
        <ul class={styles.options}>
          <FilaCambio
            titulo={`Volver a ${props.enLugarDe}`}
            detalle="El de tu rutina"
            onClick={() => props.onElegir(props.enLugarDe ?? '', alcance)}
          />
        </ul>
      )}
      {props.equivalentes.length > 0 && (
        <>
          <h3 class={styles.label}>Hacen lo mismo</h3>
          <ul class={styles.options}>
            {props.equivalentes.map((e) => (
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
      {props.sustitutos.length > 0 && (
        <>
          <h3 class={styles.label}>Los que da tu programa</h3>
          <ul class={styles.options}>
            {props.sustitutos.map((s) => (
              <FilaCambio key={s} titulo={s} onClick={() => props.onElegir(s, alcance)} />
            ))}
          </ul>
        </>
      )}
      {!props.equivalentes.length && !props.sustitutos.length && (
        <p class={styles.lead}>No hay otro que haga lo mismo: elige uno de la biblioteca.</p>
      )}
      <button type="button" class={styles.anyExercise} onClick={() => props.onBiblioteca(alcance)}>
        <SearchIcon />
        Elegir cualquier ejercicio
      </button>
    </Sheet>
  )
}
