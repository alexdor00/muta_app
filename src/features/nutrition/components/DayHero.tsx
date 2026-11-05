import { formatInt } from '../../../shared/lib/format.ts'
import styles from './DayHero.module.css'

type Macro = { nombre: string; hecho: number; objetivo: number }

type Props = {
  comidas: number
  objetivo: number
  macros: Macro[]
}

const pct = (hecho: number, objetivo: number) => Math.round(objetivo ? (hecho / objetivo) * 100 : 0)

/** La tarjeta del día: el anillo con lo que llevas de tus kcal y, al lado, cómo vas de proteína, hidratos y grasa. */
export function DayHero({ comidas, objetivo, macros }: Props) {
  const lleno = Math.min(100, pct(comidas, objetivo))
  const quedan = objetivo - comidas
  return (
    <section class={styles.hero} aria-label="Lo que llevas hoy">
      <div class={styles.ring} role="img" aria-label={`${formatInt(comidas)} de ${formatInt(objetivo)} kcal`}>
        <svg viewBox="0 0 132 132" aria-hidden="true">
          <circle class={styles.base} cx="66" cy="66" r="58" pathLength={100} />
          {lleno > 0 && (
            <circle
              class={styles.arc}
              cx="66"
              cy="66"
              r="58"
              pathLength={100}
              style={{ strokeDasharray: `${lleno} 100` }}
            />
          )}
        </svg>
        <span class={styles.center} aria-hidden="true">
          <span class={styles.number}>{formatInt(comidas)}</span>
          <span class={styles.unit}>kcal</span>
          <span class={styles.of}>de {formatInt(objetivo)}</span>
        </span>
      </div>
      <div class={styles.side}>
        <dl class={styles.macros}>
          {macros.map((m) => (
            <div key={m.nombre} class={styles.macro}>
              <dt class={styles.name}>
                {m.nombre}
                <span class={styles.pct}>{pct(m.hecho, m.objetivo)} %</span>
              </dt>
              <dd class={styles.track} aria-hidden="true">
                <i style={{ width: `${Math.min(100, pct(m.hecho, m.objetivo))}%` }} />
              </dd>
              <dd class={styles.grams}>
                {formatInt(m.hecho)} / {formatInt(m.objetivo)} g
              </dd>
            </div>
          ))}
        </dl>
        <p class={styles.left}>
          {quedan >= 0 ? `Te quedan ${formatInt(quedan)} kcal` : `${formatInt(-quedan)} kcal de más`}
        </p>
      </div>
    </section>
  )
}
