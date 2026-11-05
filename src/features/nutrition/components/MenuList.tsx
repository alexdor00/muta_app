import { formatInt } from '../../../shared/lib/format.ts'
import { CheckIcon, ForkIcon } from '../../../shared/ui/icons.tsx'
import styles from './MealList.module.css'
import m from './MenuList.module.css'

export type FilaMenu = {
  id: string
  /** «Comida 1», «Batido». */
  rotulo: string
  nombre: string
  kcal: number
  proteina: number
  apuntada: boolean
}

type Props = {
  /** «Tu menú · A». */
  titulo: string
  /** «Día de entreno». */
  detalle: string
  filas: FilaMenu[]
  onAbrir: (id: string) => void
  onApuntar: (id: string) => void
}

/** El menú de tu dieta para el día: cada receta en su tarjeta, con «Apuntar» (un toque) o «✓ Apuntada» (otro, la quita). */
export function MenuList({ titulo, detalle, filas, onAbrir, onApuntar }: Props) {
  const hechas = filas.filter((f) => f.apuntada).length
  return (
    <section class={styles.block} aria-labelledby="menu-titulo">
      <div class={styles.head}>
        <h2 id="menu-titulo" class={styles.title}>
          {titulo}
        </h2>
        <span class={styles.count}>
          {hechas} de {filas.length}
        </span>
      </div>
      <p class={m.detalle}>{detalle}</p>
      <ul class={styles.list}>
        {filas.map((f) => (
          <li key={f.id} class={styles.card}>
            <button type="button" class={styles.open} onClick={() => onAbrir(f.id)}>
              <span class={styles.thumb} aria-hidden="true">
                <ForkIcon />
              </span>
              <span class={styles.text}>
                {f.rotulo !== f.nombre && <span class={styles.detail}>{f.rotulo}</span>}
                <span class={styles.name}>{f.nombre}</span>
                <span class={styles.items}>
                  {formatInt(f.kcal)} kcal · {formatInt(f.proteina)} g prot.
                </span>
              </span>
            </button>
            <button
              type="button"
              class={`${m.toggle} ${f.apuntada ? m.done : ''}`}
              aria-pressed={f.apuntada}
              aria-label={f.apuntada ? `${f.nombre}: apuntada, quitar` : `Apuntar ${f.nombre}`}
              onClick={() => onApuntar(f.id)}
            >
              {f.apuntada ? (
                <>
                  <CheckIcon /> Apuntada
                </>
              ) : (
                'Apuntar'
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
