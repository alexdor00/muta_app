import type { ComponentChildren } from 'preact'

/** Pantalla provisional hasta tener su diseño aprobado. Sin estilos a propósito. */
export function Pending(props: { code: string; title: string; children?: ComponentChildren }) {
  return (
    <section>
      <h1>{props.title}</h1>
      <p>{props.code} · pendiente de diseño</p>
      {props.children}
    </section>
  )
}
