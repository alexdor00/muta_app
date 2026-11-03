import { ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import styles from './ExerciseList.module.css'

type Ejercicio = {
  nombre: string
  /** «3 series · 6–10 reps · al fallo». */
  detalle: string
  /** Kilos × repeticiones de cada serie la última vez («60 × 10»); vacío la primera vez. */
  ultima: readonly string[]
  /** Lo que no dice la rutina y se ha puesto por costumbre, o null. */
  sugerido?: string | null
  /** La ficha completa (null si no está en la biblioteca). */
  href: string | null
}

type Props = {
  ejercicios: readonly Ejercicio[]
  /** Fila desplegada (su posición), o null. */
  abierto: number | null
  onAbrir: (i: number | null) => void
}

/**
 * «Ejercicios» de Ver sesión: una fila por ejercicio; al tocarla se despliega lo que hiciste la última vez y el enlace a
 * la ficha completa.
 */
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
                aria-controls={`ficha-${i}`}
                onClick={() => onAbrir(open ? null : i)}
              >
                <span class={styles.text}>
                  <span class={styles.name}>{e.nombre}</span>
                  <span class={styles.detail}>{e.detalle}</span>
                  {e.sugerido && <span class={styles.suggested}>{e.sugerido}</span>}
                </span>
                <span class={`${styles.chevron} ${open ? styles.open : ''}`}>
                  <ChevronRightIcon />
                </span>
              </button>
              {open && (
                <div id={`ficha-${i}`} class={styles.last}>
                  {e.ultima.length > 0 && (
                    <>
                      <p class={styles.lastTitle}>Última vez</p>
                      <ul class={styles.sets}>
                        {e.ultima.map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {e.href && (
                    <a class={styles.more} href={e.href}>
                      Ver ficha
                      <ChevronRightIcon />
                    </a>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
