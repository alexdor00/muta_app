import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'
import { ChevronDownIcon } from './icons.tsx'
import styles from './Informe.module.css'

/** Una cifra del informe: la etiqueta a la izquierda y la cifra a la derecha; `bien`, en verde (mejora). */
export type FilaInforme = { etiqueta: string; valor: string; bien?: boolean }

/**
 * El informe de un entrenador (usuario, 2026-11-23: el de Nutrición y el de Entreno, iguales): un estado en una pastilla
 * (en negro si hay algo que decidir), un titular, las cifras que lo explican en filas y una sola recomendación.
 */
export function Informe(props: {
  estado: string
  /** Hay una sugerencia que espera: la pastilla, en negro. */
  destacado?: boolean
  titulo: string
  filas: readonly FilaInforme[]
  nota?: string | null
}) {
  return (
    <div class={styles.informe}>
      <div class={styles.cabeza}>
        <p class={styles.titulo}>{props.titulo}</p>
        <span class={props.destacado ? styles.destacado : styles.estado}>{props.estado}</span>
      </div>
      {props.filas.length > 0 && (
        <dl class={styles.filas}>
          {props.filas.map((f) => (
            <div key={f.etiqueta}>
              <dt>{f.etiqueta}</dt>
              <dd class={f.bien ? styles.bien : undefined}>{f.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {props.nota && <p class={styles.nota}>{props.nota}</p>}
    </div>
  )
}

/** Una línea de «Esta semana»: su frase y, si se puede, un enlace («Ver dónde se edita ›»). */
export type LineaSemana = string | { texto: string; enlace?: { texto: string; onClick: () => void } }

/** «Esta semana»: lo demás, una frase por cosa. */
export function EstaSemana({ lineas }: { lineas: readonly LineaSemana[] }) {
  if (!lineas.length) return null
  return (
    <div class={styles.semana}>
      <p class={styles.rotulo}>Esta semana</p>
      <ul>
        {lineas.map((l) => {
          const linea = typeof l === 'string' ? { texto: l } : l
          return (
            <li key={linea.texto}>
              {linea.texto}
              {linea.enlace && (
                <>
                  {' '}
                  <button type="button" class={styles.enlace} onClick={linea.enlace.onClick}>
                    {linea.enlace.texto}
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * La tarjeta de un entrenador: el rótulo pequeño arriba («Revisión semanal», «Tu entrenador») y su informe dentro. Con
 * `plegable` (la de Entreno, usuario 2026-11-23), sale plegada con su resumen a la derecha y se abre al tocarla.
 */
export function TarjetaInforme(props: {
  id: string
  rotulo: string
  children: ComponentChildren
  plegable?: { resumen: string }
}) {
  const [abierta, setAbierta] = useState(false)
  if (!props.plegable)
    return (
      <section class={styles.tarjeta} aria-labelledby={props.id}>
        <h2 id={props.id} class={styles.rotulo}>
          {props.rotulo}
        </h2>
        {props.children}
      </section>
    )
  return (
    <section class={styles.tarjeta} aria-labelledby={props.id}>
      <h2 class={styles.cabezaPlegable}>
        <button
          type="button"
          class={styles.plegar}
          aria-expanded={abierta}
          aria-controls={`${props.id}-contenido`}
          onClick={() => setAbierta(!abierta)}
        >
          <span id={props.id} class={styles.rotulo}>
            {props.rotulo}
          </span>
          {/* Plegada, el estado a la derecha; abierta, ya lo dice la pastilla */}
          <span class={styles.resumen}>{abierta ? '' : props.plegable.resumen}</span>
          <ChevronDownIcon />
        </button>
      </h2>
      <div id={`${props.id}-contenido`} class={styles.contenido} hidden={!abierta}>
        {props.children}
      </div>
    </section>
  )
}
