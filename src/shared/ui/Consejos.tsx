import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import { CheckIcon, ChevronDownIcon } from './icons.tsx'
import styles from './Consejos.module.css'

// Los consejos numerados 01, 02… y su tarjeta plegada: los de la sesión y «Tu entrenador» (Entreno) y «Tu nutricionista»
// (Nutrición), iguales en todos (usuario, 2026-11-19: «el diseño clavado»).

export type ConsejoVisto = {
  text: string
  why: string
  /** Se arregla con un toque, solo hoy («Invertir hoy»); `hecho` cuando ya se aplicó. */
  accion?: { label: string; hecho: boolean; onClick: () => void; textoHecho?: string } | null
  /** Botones propios debajo (los del entrenador: Aplicar, Ahora no…), con `TIP_BOTON`. */
  pie?: ComponentChildren
}

/** Las clases de los botones de un consejo: el principal (negro) y los demás (gris), y el enlace en texto. */
export const TIP_BOTON = {
  principal: styles.fix,
  secundario: styles.fixSecundario,
  enlace: styles.fixEnlace,
  fila: styles.pie,
}

/** La tarjeta y su fila de título, las de «Consejos para esta sesión» (también para «Tu entrenador»). */
export const TIP_TARJETA = {
  card: styles.card,
  summary: styles.summary,
  count: styles.count,
  abierta: styles.abierta,
}

/** Los consejos numerados 01, 02… (desde `desde` + 1) con su porqué; con botón si se arreglan con un toque. */
export function TipList({ consejos, desde = 0 }: { consejos: ConsejoVisto[]; desde?: number }) {
  return (
    <ol class={styles.tips}>
      {consejos.map((c, i) => (
        <li key={c.text} class={styles.tip}>
          <span class={styles.number} aria-hidden="true">
            {desde + i + 1}
          </span>
          <div class={styles.tipText}>
            <p class={styles.text}>{c.text}</p>
            <p class={styles.why}>{c.why}</p>
            {c.accion &&
              (c.accion.hecho ? (
                <p class={styles.done}>
                  <CheckIcon />
                  {c.accion.textoHecho ?? 'Hecho, solo hoy'}
                </p>
              ) : (
                <button type="button" class={styles.fix} onClick={c.accion.onClick}>
                  {c.accion.label}
                </button>
              ))}
            {c.pie && <div class={styles.pie}>{c.pie}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/**
 * La tarjeta plegada de «Tu entrenador» y «Tu nutricionista»: el título pequeño y, a su derecha, cuántos consejos; al
 * tocarla, la lista numerada y una nota debajo.
 */
export function TarjetaConsejos(props: {
  id: string
  titulo: string
  resumen: string
  consejos: ConsejoVisto[]
  nota: string
}) {
  const [abierta, setAbierta] = useState(false)
  if (!props.consejos.length) return null
  return (
    <section class={`${styles.card} ${abierta ? styles.abierta : ''}`} aria-labelledby={props.id}>
      <h2 class={styles.titulo}>
        <button
          type="button"
          class={`${styles.summary} ${styles.toggle}`}
          aria-expanded={abierta}
          aria-controls={`${props.id}-consejos`}
          onClick={() => setAbierta(!abierta)}
        >
          <span class={styles.cabeza}>
            <span id={props.id} class={styles.eyebrow}>
              {props.titulo}
            </span>
            <span class={styles.resumen}>{props.resumen}</span>
          </span>
          <ChevronDownIcon />
        </button>
      </h2>
      <div id={`${props.id}-consejos`} hidden={!abierta}>
        <TipList consejos={props.consejos} />
        <p class={styles.foot}>{props.nota}</p>
      </div>
    </section>
  )
}
