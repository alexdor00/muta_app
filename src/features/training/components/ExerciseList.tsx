import { ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import styles from './ExerciseList.module.css'

type Ejercicio = {
  nombre: string
  /** «3 series · 6–10 reps · al fallo». */
  detalle: string
  /** Kilos × repeticiones de cada serie la última vez («60 × 10»). */
  ultima: readonly string[]
}

type Props = {
  ejercicios: readonly Ejercicio[]
  /** Fila desplegada (su posición), o null. */
  abierto: number | null
  onAbrir: (i: number | null) => void
}

/** «Ejercicios» de Ver sesión: una fila por ejercicio; al tocarla se despliega lo que hiciste la última vez. */
export function ExerciseList({ ejercicios, abierto, onAbrir }: Props) {
  return (
    <section aria-labelledby="ejercicios">
      <h2 id="ejercicios" class={styles.title}>
        Ejercicios
      </h2>
      <ul class={styles.list}>
        {ejercicios.map((e, i) => {
          const open = abierto === i
          return (
            <li key={e.nombre} class={styles.item}>
              <button
                type="button"
                class={styles.row}
                aria-expanded={open}
                aria-controls={`ultima-${i}`}
                onClick={() => onAbrir(open ? null : i)}
              >
                <span class={styles.text}>
                  <span class={styles.name}>{e.nombre}</span>
                  <span class={styles.detail}>{e.detalle}</span>
                </span>
                <span class={`${styles.chevron} ${open ? styles.open : ''}`}>
                  <ChevronRightIcon />
                </span>
              </button>
              {open && (
                <div id={`ultima-${i}`} class={styles.last}>
                  <p class={styles.lastTitle}>Última vez</p>
                  <ul class={styles.sets}>
                    {e.ultima.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
