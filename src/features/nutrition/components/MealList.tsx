import { formatInt } from '../../../shared/lib/format.ts'
import { ChevronRightIcon, ForkIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
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
  /** La foto del plato apuntado, si salió de una receta con foto. */
  foto?: string | null
}

type Props = {
  comidas: FilaComida[]
  /** Lo que te queda, para la primera comida vacía: «Te quedan 891 kcal y 44 g de proteína». */
  quedan: string
  onAbrir: (id: string) => void
  onAnadir: (id: string) => void
}

/**
 * Las comidas del día, cada una en su tarjeta: miniatura, lo que llevas y sus kcal (se abre con «›»). La vacía dice cuánto
 * te queda y lleva «+»; la siguiente que falta, en negro. La miniatura es la foto del plato si la tiene; si no, el icono.
 */
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
        {comidas.map((c) => (
          <li key={c.id} class={styles.card}>
            <button
              type="button"
              class={styles.open}
              onClick={() => (c.alimentos ? onAbrir(c.id) : onAnadir(c.id))}
            >
              <span class={styles.thumb} aria-hidden="true">
                {c.foto ? <img src={c.foto} alt="" loading="lazy" /> : <ForkIcon />}
              </span>
              <span class={styles.text}>
                <span class={styles.name}>{c.nombre}</span>
                {c.alimentos ? (
                  <>
                    <span class={styles.detail}>{formatInt(c.proteina)} g de proteína</span>
                    <span class={styles.items}>{c.alimentos}</span>
                  </>
                ) : (
                  <span class={styles.items}>{c.id === primeraVacia ? quedan : 'Sin apuntar'}</span>
                )}
              </span>
              {c.alimentos && (
                <span class={styles.kcal}>
                  <b>{formatInt(c.kcal)}</b> kcal
                </span>
              )}
              {c.alimentos && <ChevronRightIcon />}
            </button>
            {!c.alimentos && (
              <button
                type="button"
                class={`${styles.add} ${c.id === primeraVacia ? styles.next : ''}`}
                aria-label={`Añadir ${c.al}`}
                onClick={() => onAnadir(c.id)}
              >
                <PlusIcon />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
