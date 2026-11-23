import type { PropuestaDeHoy } from '../../../shared/lib/tareaDeHoy.ts'
import styles from './Propuestas.module.css'

/**
 * Lo que te proponen las áreas para hoy (una tarjeta cada una): nada cambia hasta «Aplicar»; «Ahora
 * no» la quita.
 */
export function Propuestas({ propuestas }: { propuestas: PropuestaDeHoy[] }) {
  if (!propuestas.length) return null
  return (
    <ul class={styles.lista} aria-label="Te proponemos">
      {propuestas.map((x) => (
        <li key={x.id} class={styles.propuesta}>
          <p class={styles.titulo}>{x.titulo}</p>
          <p class={styles.detalle}>{x.detalle}</p>
          <div class={styles.botones}>
            <button type="button" class={styles.ahoraNo} onClick={x.ahoraNo}>
              Ahora no
            </button>
            <button type="button" class={styles.aplicar} onClick={x.aplicar}>
              Aplicar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
