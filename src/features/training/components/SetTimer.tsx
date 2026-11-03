import { ChoiceChips, ChoiceSegmented } from '../../../shared/ui/Choice.tsx'
import { Button } from '../../../shared/ui/Button.tsx'
import { CloseIcon, PlayIcon } from '../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../shared/ui/RoundButton.tsx'
import styles from './SetTimer.module.css'

export type ModoCronometro = 'crono' | 'cadencia' | 'cuenta'
const MODOS = [
  { value: 'crono', label: 'Cronómetro' },
  { value: 'cadencia', label: 'Cadencia' },
  { value: 'cuenta', label: 'Cuenta atrás' },
] as const

type Props = {
  /** «Serie 3 de 3». */
  serie: string
  nombre: string
  modo: ModoCronometro
  onModo: (modo: ModoCronometro) => void
  cadencias: readonly string[]
  cadencia: string
  onCadencia: (c: string) => void
  /** Duraciones de la cuenta atrás («0:30»), en segundos. */
  duraciones: readonly number[]
  duracion: number
  onDuracion: (s: number) => void
  /** Antes de empezar se eligen modo y opciones; luego, pausa y terminar. */
  estado: 'listo' | 'preparado' | 'marcha' | 'pausa'
  /** Lo de arriba del número: «Listo», «Prepárate», «Baja», «Aguanta»… */
  rotulo: string
  /** El número grande: «0:12», o «3» en la cuenta para empezar. */
  grande: string
  /** Repeticiones contadas (cadencia). */
  reps: number | null
  /** Arco del círculo (0 a 1). */
  avance: number
  formato: (s: number) => string
  onEmpezar: () => void
  onPausa: () => void
  onTerminar: () => void
  onCerrar: () => void
}

/**
 * Cronómetro de una serie (C15–C17): cronómetro, cadencia (baja-pausa-sube, cuenta las repeticiones) o cuenta atrás
 * para isométricos. Empieza tras 3-2-1; al terminar guarda el tiempo y, con cadencia, las repeticiones.
 */
export function SetTimer(props: Props) {
  const enMarcha = props.estado !== 'listo'
  const r = 46
  const vuelta = 2 * Math.PI * r
  return (
    <div class={styles.screen} role="dialog" aria-modal="true" aria-label="Cronómetro de la serie">
      <header class={styles.head}>
        <div>
          <p class={styles.kicker}>{props.serie}</p>
          <h2 class={styles.name}>{props.nombre}</h2>
        </div>
        <RoundButton label="Cerrar" variant="plain" onClick={props.onCerrar}>
          <CloseIcon />
        </RoundButton>
      </header>

      {!enMarcha && (
        <div class={styles.options}>
          <ChoiceSegmented
            name="modo-cronometro"
            legend="Modo"
            options={[...MODOS]}
            value={props.modo}
            onChange={props.onModo}
          />
          {props.modo === 'cadencia' && (
            <>
              <ChoiceChips
                name="cadencia"
                legend="Cadencia"
                options={props.cadencias.map((c) => ({ value: c, label: c }))}
                value={props.cadencia}
                onChange={props.onCadencia}
              />
              <p class={styles.help}>
                Segundos bajando, en pausa y subiendo. Suena en cada fase y cuento las repeticiones por ti. Lo
                que más importa es controlar la bajada, no un número exacto.
              </p>
            </>
          )}
          {props.modo === 'cuenta' && (
            <ChoiceChips
              name="cuenta-atras"
              legend="Duración"
              options={props.duraciones.map((s) => ({ value: String(s), label: props.formato(s) }))}
              value={String(props.duracion)}
              onChange={(v) => props.onDuracion(Number(v))}
            />
          )}
        </div>
      )}

      <div class={styles.dial}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle class={styles.track} cx="50" cy="50" r={r} />
          <circle
            class={styles.arc}
            cx="50"
            cy="50"
            r={r}
            stroke-dasharray={vuelta}
            stroke-dashoffset={vuelta * (1 - props.avance)}
          />
        </svg>
        <div class={styles.center} role="timer" aria-live="off">
          <p class={styles.phase}>{props.rotulo}</p>
          <p class={styles.big}>{props.grande}</p>
          {props.reps !== null && (
            <p class={styles.reps}>
              <b>{props.reps}</b> reps
            </p>
          )}
        </div>
      </div>

      <footer class={styles.foot}>
        {props.estado === 'listo' ? (
          <Button onClick={props.onEmpezar}>
            <span class={styles.start}>
              <PlayIcon />
              Empezar en 3
            </span>
          </Button>
        ) : (
          <div class={styles.pair}>
            <Button variant="secondary" onClick={props.onPausa}>
              {props.estado === 'pausa' ? 'Seguir' : 'Pausa'}
            </Button>
            <Button onClick={props.onTerminar}>Terminar</Button>
          </div>
        )}
      </footer>
    </div>
  )
}
