import type { ComponentChildren } from 'preact'
import { ChevronRightIcon, ForkIcon } from '../../../shared/ui/icons.tsx'
import { useDragScroll } from '../../../shared/ui/useDragScroll.ts'
import styles from './Platos.module.css'

/** La foto redonda de un plato (sin foto, el icono de Comida). */
export function PlatoFoto({ foto, grande = false }: { foto: string | null; grande?: boolean }) {
  return (
    <span class={`${styles.foto} ${grande ? styles.grande : ''}`} aria-hidden="true">
      {foto ? <img src={foto} alt="" loading="lazy" /> : <ForkIcon />}
    </span>
  )
}

/** Una fila de una lista de platos: foto, nombre, sus líneas y «›» (o la acción que lleve). */
export function PlatoFila(props: {
  nombre: string
  foto: string | null
  lineas: string[]
  href?: string
  onClick?: () => void
  accion?: ComponentChildren
}) {
  const dentro = (
    <>
      <PlatoFoto foto={props.foto} grande />
      <span class={styles.texto}>
        <span class={styles.nombre}>{props.nombre}</span>
        {props.lineas.map((l) => (
          <span key={l} class={styles.linea}>
            {l}
          </span>
        ))}
      </span>
      {!props.accion && <ChevronRightIcon />}
    </>
  )
  return (
    <li class={styles.fila}>
      {props.href ? (
        <a class={styles.abrir} href={props.href}>
          {dentro}
        </a>
      ) : (
        <button type="button" class={styles.abrir} onClick={props.onClick}>
          {dentro}
        </button>
      )}
      {props.accion}
    </li>
  )
}

/** Una tarjeta de un carrusel: la foto arriba y el nombre con una línea debajo. */
export function PlatoTarjeta(props: { nombre: string; foto: string | null; linea: string; href: string }) {
  return (
    <li class={styles.tarjeta}>
      <a href={props.href} class={styles.tarjetaEnlace}>
        <span class={styles.tarjetaFoto} aria-hidden="true">
          {props.foto ? <img src={props.foto} alt="" loading="lazy" /> : <ForkIcon />}
        </span>
        <span class={styles.tarjetaTexto}>
          <span class={styles.tarjetaNombre}>{props.nombre}</span>
          <span class={styles.linea}>{props.linea}</span>
        </span>
      </a>
    </li>
  )
}

/** Un carrusel con su título y, si se pasa, un enlace a todos («6 ›»). */
export function Carrusel(props: {
  id: string
  titulo: string
  extra?: string
  href?: string
  children: ComponentChildren
}) {
  const drag = useDragScroll<HTMLUListElement>()
  return (
    <section class={styles.carrusel} aria-labelledby={props.id}>
      <div class={styles.cabeza}>
        <h2 id={props.id} class={styles.titulo}>
          {props.titulo}
        </h2>
        {props.href ? (
          <a class={styles.extra} href={props.href}>
            {props.extra} ›
          </a>
        ) : (
          props.extra && <span class={styles.extraTexto}>{props.extra}</span>
        )}
      </div>
      <ul class={styles.pista} ref={drag}>
        {props.children}
      </ul>
    </section>
  )
}
