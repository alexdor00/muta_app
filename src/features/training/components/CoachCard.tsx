import styles from './CoachCard.module.css'

/** Lo que pinta la tarjeta de cada consejo (el consejo entero vuelve en los botones). */
type Consejo = {
  musculo: string
  lectura: string
  titulo: string
  detalle: string
  mejora: { mejoran: number; comparables: number }
  propuesta: { campo: 'series' | 'rir'; de: number; a: number; aMas?: number } | null
  noMeInteresa: boolean
}

type Props<T extends Consejo> = {
  consejos: T[]
  /** Con `a`, el valor elegido (la opción de +2 series); sin él, el propuesto. */
  onAplicar: (c: T, a?: number) => void
  onDejar: (c: T) => void
  /** «No me interesa»: ese músculo pasa a Mantener. */
  onNoMeInteresa: (c: T) => void
}

/**
 * «Tu entrenador» en Tu plan: cada músculo con su % de series que mejoran esta semana y lo que toca según la guía. Con
 * propuesta (una serie más o menos), «Aplicar» y «Ahora no» (y, si propone subir, «No me interesa», que lo pasa a Mantener);
 * sin ella, «Entendido». Todo son sugerencias: nada cambia hasta que lo aplicas.
 */
export function CoachCard<T extends Consejo>({ consejos, onAplicar, onDejar, onNoMeInteresa }: Props<T>) {
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
                    {c.propuesta.campo === 'rir'
                      ? `Aplicar: RIR ${c.propuesta.de} → ${c.propuesta.a}`
                      : `Aplicar: ${c.propuesta.de} → ${c.propuesta.a} series`}
                  </button>
                  {c.propuesta.aMas !== undefined && (
                    <button
                      type="button"
                      class={styles.apply}
                      onClick={() => onAplicar(c, c.propuesta?.aMas)}
                    >
                      {`${c.propuesta.de} → ${c.propuesta.aMas} series`}
                    </button>
                  )}
                  <button type="button" class={styles.later} onClick={() => onDejar(c)}>
                    Ahora no
                  </button>
                  {c.noMeInteresa && (
                    <button type="button" class={styles.later} onClick={() => onNoMeInteresa(c)}>
                      No me interesa
                    </button>
                  )}
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
        Solo son sugerencias: nada cambia hasta que lo aplicas. Cada serie frente a la misma de la vez
        anterior, en los últimos 7 días: mejora si subes kilos o repeticiones, y solo cuentan los ejercicios
        con el RIR apuntado. Toca subir volumen tras 3 semanas mejorando en casi todas (80 %, sugerido) sin ir
        peor: un músculo cada vez, una o dos series.
      </p>
    </section>
  )
}
