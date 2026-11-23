import type { ComponentChildren } from 'preact'
import { formatInt } from '../../../shared/lib/format.ts'
import { PotIcon } from '../../../shared/ui/iconosHoy.tsx'
import { ClockIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import { PlatoFoto } from './Platos.tsx'
import styles from './FilaComida.module.css'

/** De dónde sale una comida: de lo que cocinaste otro día o se hace al momento. */
export type Origen = { tipo: 'olla' | 'momento'; texto: string }

/**
 * Una comida en una lista (Plan, usuario 2026-11-18): la foto, la hora y su nombre, el plato, de dónde sale y sus kcal a la
 * derecha. La misma fila en «Qué comes» y en un menú.
 */
export function FilaComida(props: {
  foto: string | null
  etiqueta: string
  nombre: string
  origen?: Origen | null
  kcal: number | null
  onClick: () => void
  etiquetaAccesible?: string
}) {
  return (
    <li>
      <button type="button" class={styles.fila} onClick={props.onClick} aria-label={props.etiquetaAccesible}>
        <PlatoFoto foto={props.foto} />
        <span class={styles.texto}>
          <span class={styles.etiqueta}>{props.etiqueta}</span>
          <span class={styles.nombre}>{props.nombre}</span>
          {props.origen && (
            <span class={styles.origen}>
              {props.origen.tipo === 'olla' ? <PotIcon /> : <ClockIcon />}
              {props.origen.texto}
            </span>
          )}
        </span>
        {props.kcal !== null && (
          <span class={styles.kcal}>
            <b>{formatInt(props.kcal)}</b>
            <small>kcal</small>
          </span>
        )}
      </button>
    </li>
  )
}

/** La última fila de una lista de comidas: «+» y lo que añade. */
export function FilaAnadir(props: { children: ComponentChildren; onClick: () => void }) {
  return (
    <li>
      <button type="button" class={styles.fila} onClick={props.onClick}>
        <span class={styles.mas} aria-hidden="true">
          <PlusIcon />
        </span>
        <span class={styles.nombre}>{props.children}</span>
      </button>
    </li>
  )
}
