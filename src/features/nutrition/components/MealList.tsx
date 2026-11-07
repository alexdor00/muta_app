import { formatInt } from '../../../shared/lib/format.ts'
import { CheckIcon, ChevronRightIcon, ForkIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
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
  /** El plato de tu menú para esta comida (aún sin apuntar o ya apuntado con el tick). */
  menu?: { nombre: string; kcal: number; foto: string | null; hecho: boolean }
}

type Props = {
  /** «Comidas» o el nombre del menú de hoy. */
  titulo: string
  comidas: FilaComida[]
  /** Lo que te queda, para la primera comida vacía: «Te quedan 891 kcal y 44 g de proteína». */
  quedan: string
  onAbrir: (id: string) => void
  onAnadir: (id: string) => void
  /** El tick de una comida con plato del menú: apuntarlo o quitarlo. */
  onTick: (id: string) => void
}

/**
 * Las comidas del día, cada una en su tarjeta: miniatura, lo que llevas y sus kcal. Con menú, cada comida trae su plato y
 * un tick para apuntarlo; sin menú, la vacía dice cuánto te queda y lleva «+». La miniatura es la foto del plato si la
 * tiene; si no, el icono.
 */
export function MealList({ titulo, comidas, quedan, onAbrir, onAnadir, onTick }: Props) {
  const primeraVacia = comidas.find((c) => !c.alimentos && !c.menu)?.id
  const hechas = comidas.filter((c) => c.alimentos).length
  return (
    <section class={styles.block} aria-labelledby="comidas-titulo">
      <div class={styles.head}>
        <h2 id="comidas-titulo" class={styles.title}>
          {titulo}
        </h2>
        <span class={styles.count}>
          {hechas} de {comidas.length}
        </span>
      </div>
      <ul class={styles.list}>
        {comidas.map((c) => {
          const m = c.menu
          const ver = m && !c.alimentos
          const foto = ver ? m.foto : c.foto
          return (
            <li key={c.id} class={styles.card}>
              <button
                type="button"
                class={styles.open}
                onClick={() => (c.alimentos || m ? onAbrir(c.id) : onAnadir(c.id))}
              >
                <span class={styles.thumb} aria-hidden="true">
                  {foto ? <img src={foto} alt="" loading="lazy" /> : <ForkIcon />}
                </span>
                <span class={styles.text}>
                  <span class={styles.name}>{c.nombre}</span>
                  {ver ? (
                    <>
                      <span class={styles.items}>{m.nombre}</span>
                      <span class={styles.detail}>{formatInt(m.kcal)} kcal</span>
                    </>
                  ) : c.alimentos ? (
                    <>
                      <span class={styles.items}>{c.alimentos}</span>
                      <span class={styles.detail}>
                        {formatInt(c.kcal)} kcal · {formatInt(c.proteina)} g de proteína
                      </span>
                    </>
                  ) : (
                    <span class={styles.items}>{c.id === primeraVacia ? quedan : 'Sin apuntar'}</span>
                  )}
                </span>
                {c.alimentos && !m && <ChevronRightIcon />}
              </button>
              {m && (
                // Con plato del menú también se apunta otra cosa (por si hoy no sigues el menú)
                <button
                  type="button"
                  class={styles.add}
                  aria-label={`Añadir otra cosa ${c.al}`}
                  onClick={() => onAnadir(c.id)}
                >
                  <PlusIcon />
                </button>
              )}
              {m ? (
                <button
                  type="button"
                  class={`${styles.tick} ${m.hecho ? styles.tickOn : ''}`}
                  aria-pressed={m.hecho}
                  aria-label={m.hecho ? `${c.nombre}: hecho, quitar` : `${c.nombre}: apuntar ${m.nombre}`}
                  onClick={() => onTick(c.id)}
                >
                  {m.hecho && <CheckIcon />}
                </button>
              ) : (
                !c.alimentos && (
                  <button
                    type="button"
                    class={`${styles.add} ${c.id === primeraVacia ? styles.next : ''}`}
                    aria-label={`Añadir ${c.al}`}
                    onClick={() => onAnadir(c.id)}
                  >
                    <PlusIcon />
                  </button>
                )
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
