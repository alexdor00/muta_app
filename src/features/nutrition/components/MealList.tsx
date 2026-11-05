import { formatInt } from '../../../shared/lib/format.ts'
import { ChevronRightIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import styles from './MealList.module.css'

export type FilaComida = {
  id: string
  nombre: string
  /** «a la cena»: para «Añadir a la cena». */
  al: string
  kcal: number
  proteina: number
  /** Los alimentos, en una línea; vacía si no hay nada. */
  alimentos: string
}

type Props = {
  comidas: FilaComida[]
  /** Lo que te queda, para la primera comida vacía: «Te quedan 891 kcal y 44 g de proteína». */
  quedan: string
  onAbrir: (id: string) => void
  onAnadir: (id: string) => void
}

/** Las comidas del día: cada una con sus kcal y su proteína; la vacía dice cuánto te queda y lleva «+» en negro. */
export function MealList({ comidas, quedan, onAbrir, onAnadir }: Props) {
  const primeraVacia = comidas.find((c) => !c.alimentos)?.id
  const hechas = comidas.filter((c) => c.alimentos).length
  return (
    <section class={styles.block} aria-labelledby="comidas-titulo">
      <div class={styles.head}>
        <h2 id="comidas-titulo" class={styles.title}>
          Comidas
        </h2>
        <span class={styles.count}>
          {hechas} de {comidas.length}
        </span>
      </div>
      <ul class={styles.list}>
        {comidas.map((c) =>
          c.alimentos ? (
            <li key={c.id} class={styles.row}>
              <button type="button" class={styles.open} onClick={() => onAbrir(c.id)}>
                <span class={styles.text}>
                  <span class={styles.name}>{c.nombre}</span>
                  <span class={styles.items}>{c.alimentos}</span>
                </span>
                <span class={styles.numbers}>
                  <span class={styles.kcal}>
                    <b>{formatInt(c.kcal)}</b> kcal
                  </span>
                  <span class={styles.protein}>{formatInt(c.proteina)} g prot.</span>
                </span>
                <ChevronRightIcon />
              </button>
              <button
                type="button"
                class={styles.add}
                aria-label={`Añadir ${c.al}`}
                onClick={() => onAnadir(c.id)}
              >
                <PlusIcon />
              </button>
            </li>
          ) : (
            <li key={c.id} class={styles.row}>
              <button type="button" class={styles.open} onClick={() => onAnadir(c.id)}>
                <span class={styles.text}>
                  <span class={styles.name}>{c.nombre}</span>
                  <span class={styles.items}>{c.id === primeraVacia ? quedan : 'Sin apuntar'}</span>
                </span>
              </button>
              <button
                type="button"
                class={`${styles.add} ${c.id === primeraVacia ? styles.next : ''}`}
                aria-label={`Añadir ${c.al}`}
                onClick={() => onAnadir(c.id)}
              >
                <PlusIcon />
              </button>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
