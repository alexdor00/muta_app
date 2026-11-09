import styles from './CoachCard.module.css'

/** Lo que pinta la tarjeta de cada consejo (el consejo entero vuelve en los botones). */
type Consejo = {
  musculo: string
  lectura: string
  titulo: string
  detalle: string
  mejora: { mejoran: number; comparables: number }
  propuesta: { de: number; a: number } | null
}

type Props<T extends Consejo> = {
  consejos: T[]
  onAplicar: (c: T) => void
  onDejar: (c: T) => void
}

/**
 * «Tu entrenador» en Tu plan: cada músculo con su % de series que mejoran esta semana y lo que toca según la guía. Con
 * propuesta (+1 serie), «Aplicar» y «Ahora no»; sin ella, «Entendido». Nada cambia hasta que lo aplicas.
 */
export function CoachCard<T extends Consejo>({ consejos, onAplicar, onDejar }: Props<T>) {
  if (!consejos.length) return null
  return (
    <section class={styles.card} aria-labelledby="entrenador">
      <p class={styles.eyebrow}>Esta semana</p>
      <h2 id="entrenador" class={styles.title}>
        Tu entrenador
      </h2>
      <ul class={styles.list}>
        {consejos.map((c) => (
          <li key={`${c.musculo}-${c.lectura}`} class={styles.item}>
            <div class={styles.head}>
              <b class={styles.name}>{c.titulo}</b>
              <span class={styles.pct} aria-hidden="true">
                {Math.round((c.mejora.mejoran / c.mejora.comparables) * 100)} %
              </span>
            </div>
            <p class={styles.text}>{c.detalle}</p>
            <div class={styles.actions}>
              {c.propuesta ? (
                <>
                  <button type="button" class={styles.apply} onClick={() => onAplicar(c)}>
                    Aplicar: {c.propuesta.de} → {c.propuesta.a} series
                  </button>
                  <button type="button" class={styles.later} onClick={() => onDejar(c)}>
                    Ahora no
                  </button>
                </>
              ) : (
                <button type="button" class={styles.later} onClick={() => onDejar(c)}>
                  Entendido
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p class={styles.foot}>
        Series que mejoran la misma serie de la vez anterior, en los últimos 7 días. «Casi todas»: desde el 80
        % (sugerido).
      </p>
    </section>
  )
}
