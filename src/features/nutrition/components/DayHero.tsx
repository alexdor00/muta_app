import type { ComponentChildren } from 'preact'
import { formatInt } from '../../../shared/lib/format.ts'
import { CheckIcon, SwapIcon } from '../../../shared/ui/icons.tsx'
import styles from './DayHero.module.css'

type Macro = { nombre: string; hecho: number; objetivo: number }

type Props = {
  comidas: number
  objetivo: number
  macros: Macro[]
  /** Debajo de la frase, dentro de la tarjeta: los botones («+ Añadir», «Cuadrar con recetas»). */
  children?: ComponentChildren
  /** La frase de debajo (de serie, «Llevas X de Y kcal.»). */
  frase?: string
  /** Su día, centrado arriba dentro de la tarjeta («Hoy» y «Domingo, 15 de noviembre»). */
  dia?: { titulo: string; detalle: string }
  /** Arriba a la derecha: «Entreno» o «Descanso». */
  etiqueta?: string
  /** Si se da, la etiqueta se toca para cambiar el tipo de día (hoy; usuario, 2026-11-19). */
  onEtiqueta?: () => void
  /** El día está completo: el anillo se cierra y en el centro va el tick, en naranja (el logro). */
  completo?: boolean
  /** Tocar el anillo y los macros abre tu objetivo (usuario, 2026-11-18: sin «Objetivo» arriba). */
  objetivoHref?: string
}

const pct = (hecho: number, objetivo: number) => Math.round(objetivo ? (hecho / objetivo) * 100 : 0)
/** El anillo está abierto por abajo: el arco ocupa tres cuartos de la vuelta. */
const ARCO = 75

/**
 * La tarjeta del día (propuesta «tarjetas», 2026-11-12): a la izquierda, el anillo abierto por abajo con lo que te queda
 * («1.781 kcal por comer»); a la derecha, cada macro en una línea («Proteína … 38 / 146 g») con su barra; debajo, una frase y
 * los botones.
 */
export function DayHero(props: Props) {
  const { comidas, objetivo, macros, children, frase, dia, etiqueta, completo, objetivoHref, onEtiqueta } =
    props
  const lleno = completo ? 100 : Math.min(100, pct(comidas, objetivo))
  const quedan = objetivo - comidas
  return (
    <section
      class={styles.hero}
      aria-label={dia ? `Lo que llevas ${dia.titulo.toLowerCase()}` : 'Lo que llevas hoy'}
    >
      {dia && (
        <header class={styles.dia}>
          <div>
            <h2 class={styles.diaTitulo}>{dia.titulo}</h2>
            <p class={styles.diaDetalle}>{dia.detalle}</p>
          </div>
          {etiqueta &&
            (onEtiqueta ? (
              <button
                type="button"
                class={`${styles.etiqueta} ${styles.etiquetaBoton}`}
                aria-label={`${etiqueta}: cambiar el tipo de día`}
                onClick={onEtiqueta}
              >
                {etiqueta}
                <SwapIcon />
              </button>
            ) : (
              <span class={styles.etiqueta}>{etiqueta}</span>
            ))}
        </header>
      )}
      <div class={styles.top}>
        <div
          class={styles.ring}
          role="img"
          aria-label={`${formatInt(comidas)} de ${formatInt(objetivo)} kcal`}
        >
          <svg viewBox="0 0 132 132" aria-hidden="true">
            <circle
              class={styles.base}
              cx="66"
              cy="66"
              r="56"
              pathLength={100}
              style={{ strokeDasharray: `${ARCO} 100` }}
            />
            {completo ? (
              <circle class={styles.arc} cx="66" cy="66" r="56" />
            ) : (
              lleno > 0 && (
                <circle
                  class={styles.arc}
                  cx="66"
                  cy="66"
                  r="56"
                  pathLength={100}
                  style={{ strokeDasharray: `${(ARCO * lleno) / 100} 100` }}
                />
              )
            )}
          </svg>
          <span class={styles.center} aria-hidden="true">
            {completo ? (
              <>
                <span class={styles.tick}>
                  <CheckIcon />
                </span>
                <span class={styles.unit}>Día completo</span>
              </>
            ) : (
              <>
                <span class={styles.number}>{formatInt(Math.abs(quedan))}</span>
                <span class={styles.unit}>{quedan >= 0 ? 'kcal por comer' : 'kcal de más'}</span>
              </>
            )}
          </span>
        </div>
        <span class={styles.lado}>
          <dl class={styles.macros}>
            {macros.map((m) => (
              <div key={m.nombre} class={styles.macro}>
                <dt class={styles.name}>{m.nombre}</dt>
                <dd class={styles.grams}>
                  <b>{formatInt(m.hecho)}</b> / {formatInt(m.objetivo)} g
                </dd>
                <dd class={styles.track} aria-hidden="true">
                  <i style={{ width: `${Math.min(100, pct(m.hecho, m.objetivo))}%` }} />
                </dd>
              </div>
            ))}
          </dl>
          {objetivoHref && (
            <a class={styles.verObjetivo} href={objetivoHref}>
              Tu objetivo ›
            </a>
          )}
        </span>
      </div>
      <p class={styles.frase}>{frase ?? `Llevas ${formatInt(comidas)} de ${formatInt(objetivo)} kcal.`}</p>
      {children && <div class={styles.botones}>{children}</div>}
    </section>
  )
}
