import { CloseIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import styles from './WorkoutExercise.module.css'

/**
 * Las filas de la técnica de una serie de la sesión (bajadas del dropset, mini-series del rest-pause…): una fila fina por cada una, con la misma rejilla
 * que las series (↳, kilos, repeticiones, su nombre y ×). La primera está siempre, vacía, para apuntarla; «+ Bajada» (o
 * la que sea) sale cuando la última ya tiene algo escrito.
 */
export function SetExtras(props: {
  serie: number
  extra: { kg: string; reps: string; kgGris: string }[]
  /** Cómo se llama cada fila («Bajada», «Mini-serie»…); null si el ejercicio no lleva técnica. */
  fila: string | null
  onAnadir: (serie: number) => void
  onCambio: (serie: number, n: number, campo: 'kg' | 'reps', valor: string) => void
  onQuitar: (serie: number, n: number) => void
}) {
  const ultima = props.extra.at(-1)
  return (
    <>
      {props.extra.map((x, n) => {
        const que = `${props.fila ?? ''} ${n + 1}`
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
            {x.kg || x.reps || n > 0 ? (
              <button
                type="button"
                class={styles.extraRemove}
                aria-label={`Quitar la ${que.toLowerCase()} de la serie ${props.serie + 1}`}
                onClick={() => props.onQuitar(props.serie, n)}
              >
                <CloseIcon />
              </button>
            ) : (
              <span />
            )}
          </div>
        )
      })}
      {props.fila && ultima && (ultima.kg || ultima.reps) && (
        <button type="button" class={styles.addExtra} onClick={() => props.onAnadir(props.serie)}>
          <PlusIcon />
          {props.fila}
        </button>
      )}
    </>
  )
}
