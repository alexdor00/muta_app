import { formatInt } from '../../../shared/lib/format.ts'
import styles from './DayHero.module.css'

type Macro = { nombre: string; hecho: number; objetivo: number }

type Props = {
  /** «Jueves 5 nov». */
  fecha: string
  comidas: number
  objetivo: number
  macros: Macro[]
}

const parte = (hecho: number, objetivo: number) =>
  `${Math.min(100, objetivo ? (hecho / objetivo) * 100 : 0)}%`

/** La tarjeta de color de Comida: lo que te queda por comer hoy, en grande, y cómo vas de proteína, hidratos y grasa. */
export function DayHero({ fecha, comidas, objetivo, macros }: Props) {
  const quedan = objetivo - comidas
  return (
    <section class={styles.hero} aria-label="Lo que llevas hoy">
      <div class={styles.top}>
        <span class={styles.date}>{fecha}</span>
        <span class={styles.soft}>
          {formatInt(comidas)} de {formatInt(objetivo)} kcal
        </span>
      </div>
      <p class={styles.left}>
        <span class={styles.number}>{formatInt(Math.abs(quedan))}</span>
        <span class={styles.unit}>
          kcal
          <br />
          {quedan >= 0 ? 'por comer' : 'de más'}
        </span>
      </p>
      <div class={styles.track} aria-hidden="true">
        <i style={{ width: parte(comidas, objetivo) }} />
      </div>
      <dl class={styles.macros}>
        {macros.map((m) => (
          <div key={m.nombre} class={styles.macro}>
            <dt>{m.nombre}</dt>
            <dd>
              <b>{formatInt(m.hecho)}</b> / {formatInt(m.objetivo)} g
            </dd>
            <dd class={styles.track} aria-hidden="true">
              <i style={{ width: parte(m.hecho, m.objetivo) }} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
