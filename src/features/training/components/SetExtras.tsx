import { CloseIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import styles from './WorkoutExercise.module.css'

/**
 * Las bajadas (dropset) o mini-series (rest-pause) de una serie de la sesión: una fila fina por cada una, con la misma rejilla
 * que las series (↳, kilos, repeticiones, su nombre y ×), y «+ Bajada» o «+ Mini-serie» cuando la serie está hecha.
 */
export function SetExtras(props: {
  serie: number
  extra: { kg: string; reps: string; kgGris: string }[]
  hecha: boolean
  tecnica: 'dropset' | 'pausa' | null
  onAnadir: (serie: number) => void
  onCambio: (serie: number, n: number, campo: 'kg' | 'reps', valor: string) => void
  onQuitar: (serie: number, n: number) => void
}) {
  return (
    <>
      {props.extra.map((x, n) => {
        const que = props.tecnica === 'pausa' ? `Mini-serie ${n + 1}` : `Bajada ${n + 1}`
        return (
          <div key={n} class={`${styles.set} ${styles.extra}`}>
            <span class={styles.extraMark} aria-hidden="true">
              ↳
            </span>
            <input
              class={styles.cell}
              inputMode="decimal"
              aria-label={`Kilos de la ${que.toLowerCase()} de la serie ${props.serie + 1}`}
              value={x.kg}
              placeholder={x.kgGris}
              onInput={(e) => props.onCambio(props.serie, n, 'kg', e.currentTarget.value)}
            />
            <input
              class={styles.cell}
              inputMode="numeric"
              aria-label={`Repeticiones de la ${que.toLowerCase()} de la serie ${props.serie + 1}`}
              value={x.reps}
              onInput={(e) => props.onCambio(props.serie, n, 'reps', e.currentTarget.value)}
            />
            <span class={styles.extraName}>{que}</span>
            <button
              type="button"
              class={styles.extraRemove}
              aria-label={`Quitar la ${que.toLowerCase()} de la serie ${props.serie + 1}`}
              onClick={() => props.onQuitar(props.serie, n)}
            >
              <CloseIcon />
            </button>
          </div>
        )
      })}
      {props.tecnica && props.hecha && (
        <button type="button" class={styles.addExtra} onClick={() => props.onAnadir(props.serie)}>
          <PlusIcon />
          {props.tecnica === 'pausa' ? 'Mini-serie' : 'Bajada'}
        </button>
      )}
    </>
  )
}
