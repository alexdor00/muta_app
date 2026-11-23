import styles from './Barras.module.css'

export type Barra = {
  /** Lo que se lee bajo la barra («L», «Hoy», «3 nov»). */
  etiqueta: string
  valor: number
  /** La meta de esa barra (una raya sobre ella), si cambia de una a otra; null o sin poner, sin raya propia. */
  meta?: number | null
  /** En gris: aún no ha terminado (hoy, esta semana). */
  enCurso?: boolean
}

type Props = {
  barras: Barra[]
  /** Una raya para todas, con su texto («4 por semana»). */
  meta?: { valor: number; texto: string } | null
  /** Lo que lee el lector de pantalla. */
  resumen: string
}

/** Barras verticales (la semana de comida, tus semanas de entreno) con la raya de la meta; la que va en curso, en gris. */
export function Barras({ barras, meta, resumen }: Props) {
  const tope = Math.max(1, ...barras.map((b) => Math.max(b.valor, b.meta ?? 0)), meta ? meta.valor * 1.15 : 0)
  const alto = (n: number) => `${(Math.min(n, tope) / tope) * 100}%`
  return (
    <figure class={styles.chart}>
      <div class={styles.area} aria-hidden="true">
        {meta && (
          <span class={styles.goal} style={{ bottom: alto(meta.valor) }}>
            <span class={styles.goalLabel}>{meta.texto}</span>
          </span>
        )}
        {barras.map((b, i) => (
          <span key={i} class={styles.col}>
            <span
              class={`${styles.bar} ${b.enCurso ? styles.enCurso : ''}`}
              style={{ height: alto(b.valor) }}
            />
            {b.meta ? <span class={styles.tick} style={{ bottom: alto(b.meta) }} /> : null}
          </span>
        ))}
      </div>
      <div class={styles.labels} aria-hidden="true">
        {barras.map((b, i) => (
          <span key={i} class={b.enCurso ? styles.labelEnCurso : ''}>
            {b.etiqueta}
          </span>
        ))}
      </div>
      <figcaption class={styles.hidden}>{resumen}</figcaption>
    </figure>
  )
}
