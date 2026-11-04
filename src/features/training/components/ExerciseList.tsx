import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon } from '../../../shared/ui/icons.tsx'
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
  /** Frente a la vez anterior: «2,4 %» y si sube (1), baja (−1) o se queda igual (0); null si no hay dos veces. */
  cambio: { texto: string; sentido: 1 | 0 | -1 } | null
}

type Props = {
  ejercicios: readonly Ejercicio[]
  /** Fila desplegada (su posición), o null. */
  abierto: number | null
  onAbrir: (i: number | null) => void
  /** «6 de 7 suben»; null si ningún ejercicio tiene con qué compararse. */
  suben: string | null
}

/**
 * «Ejercicios» de Ver sesión: una fila por ejercicio con su cambio frente a la vez anterior a la derecha (↑ naranja si
 * sube, ↓ si baja) y, arriba, cuántos suben; al tocarla se despliega lo que hiciste la última vez y el enlace a la ficha.
 */
export function ExerciseList({ ejercicios, abierto, onAbrir, suben }: Props) {
  return (
    <section aria-labelledby="ejercicios">
      <div class={styles.head}>
        <h2 id="ejercicios" class={styles.title}>
          Ejercicios
        </h2>
        {suben && <span class={styles.count}>{suben}</span>}
      </div>
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
                {e.cambio && (
                  <span
                    class={`${styles.change} ${e.cambio.sentido > 0 ? styles.up : e.cambio.sentido < 0 ? styles.down : ''}`}
                    aria-label={
                      e.cambio.sentido > 0
                        ? `Sube ${e.cambio.texto} frente a la vez anterior`
                        : e.cambio.sentido < 0
                          ? `Baja ${e.cambio.texto} frente a la vez anterior`
                          : 'Igual que la vez anterior'
                    }
                  >
                    {e.cambio.sentido > 0 ? <ArrowUpIcon /> : e.cambio.sentido < 0 ? <ArrowDownIcon /> : null}
                    <span aria-hidden="true">{e.cambio.texto}</span>
                  </span>
                )}
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
