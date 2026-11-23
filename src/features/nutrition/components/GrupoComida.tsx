import type { ComponentChildren } from 'preact'
import { formatInt } from '../../../shared/lib/format.ts'
import { PotIcon } from '../../../shared/ui/iconosHoy.tsx'
import { Deslizable } from '../../../shared/ui/Deslizable.tsx'
import { ClockIcon, PlusIcon } from '../../../shared/ui/icons.tsx'
import type { Origen } from './FilaComida.tsx'
import { PlatoFoto } from './Platos.tsx'
import styles from './GrupoComida.module.css'

/** Una cosa de una comida: el plato o algo más (con su foto y sus kcal). */
export type CosaDeComida = {
  nombre: string
  foto: string | null
  kcal: number
  /** Deslizar a la izquierda la quita (como en tu día). */
  onQuitar?: () => void
  /** Tocarla abre lo suyo (la receta); sin él, lo de la comida (usuario, 2026-11-21). */
  onTocar?: () => void
}

/** Las comidas, una tarjeta debajo de otra. */
export function ListaGrupos(props: { children: ComponentChildren; etiqueta?: string }) {
  return (
    <ul class={styles.lista} aria-label={props.etiqueta}>
      {props.children}
    </ul>
  )
}

/**
 * Una comida en su tarjeta (usuario, 2026-11-19: como las comidas de tu día, más sencilla): arriba su nombre, su hora y
 * sus kcal; debajo, una fila por cosa (el plato y lo demás) con su foto y, en la primera, de dónde sale. Se toca entera.
 * Con `onAnadir` y `onQuitar`, como en tu día (usuario, 2026-11-20): el «+» redondo arriba y deslizar quita.
 */
export function GrupoComida(props: {
  titulo: string
  meta: string
  kcal: number
  cosas: CosaDeComida[]
  origen?: Origen | null
  onClick: () => void
  etiquetaAccesible?: string
  /** Desde «Tu nutricionista»: la comida que hay que cambiar, con un filo negro. */
  marcada?: boolean
  /** El «+» redondo de la cabecera (como en tu día): añadir algo a esta comida. */
  onAnadir?: () => void
}) {
  const cosa = (x: CosaDeComida, i: number) => (
    <button type="button" class={styles.cosa} onClick={x.onTocar ?? props.onClick}>
      <PlatoFoto foto={x.foto} />
      <span class={styles.texto}>
        <span class={styles.nombre}>{x.nombre}</span>
        {i === 0 && props.origen ? (
          <span class={styles.origen}>
            {props.origen.tipo === 'olla' ? <PotIcon /> : <ClockIcon />}
            {props.origen.texto}
          </span>
        ) : (
          <small>{formatInt(x.kcal)} kcal</small>
        )}
      </span>
    </button>
  )
  return (
    <li class={`${styles.grupo} ${props.marcada ? styles.marcada : ''}`}>
      <div class={styles.arriba}>
        <button
          type="button"
          class={styles.cabeza}
          onClick={props.onClick}
          aria-label={props.etiquetaAccesible}
        >
          <b>{props.titulo}</b>
          <span class={styles.total}>{formatInt(props.kcal)} kcal</span>
          <small class={styles.meta}>{props.meta}</small>
        </button>
        {props.onAnadir && (
          <button
            type="button"
            class={styles.add}
            aria-label={`Añadir a ${props.titulo.toLowerCase()}`}
            onClick={props.onAnadir}
          >
            <PlusIcon />
          </button>
        )}
      </div>
      {props.cosas.map((x, i) =>
        x.onQuitar ? (
          <Deslizable
            key={`${x.nombre}-${i}`}
            fondo="surface"
            ariaLabel={`Quitar ${x.nombre}`}
            onQuitar={x.onQuitar}
          >
            {cosa(x, i)}
          </Deslizable>
        ) : (
          <div key={`${x.nombre}-${i}`}>{cosa(x, i)}</div>
        ),
      )}
    </li>
  )
}

/** Una comida sin nada: su tarjeta con «+ Añadir». */
export function GrupoVacio(props: { titulo: string; meta: string; onClick: () => void; marcada?: boolean }) {
  return (
    <li class={`${styles.grupo} ${props.marcada ? styles.marcada : ''}`}>
      <button type="button" class={styles.boton} onClick={props.onClick}>
        <span class={styles.cabeza}>
          <b>{props.titulo}</b>
          <small class={styles.meta}>{props.meta}</small>
        </span>
        <span class={styles.anadir}>
          <PlusIcon />
          Añadir
        </span>
      </button>
    </li>
  )
}
