import type { ComponentChildren } from 'preact'
import styles from './Pasos.module.css'

type Props = {
  paso: number
  total: number
  titulo: string
  intro: string
  /** Contenido del paso (opciones, campos…). */
  children: ComponentChildren
  /** El botón principal («Siguiente»). */
  accion: ComponentChildren
  /** Debajo del botón, si lo hay: «Ahora no, solo entreno». */
  secundaria?: ComponentChildren
}

/**
 * Un paso de la bienvenida (usuario, 2026-11-17: la estética del rediseño de Nutrición, la misma en Entreno y en
 * Nutrición): arriba, una barra por paso (las hechas en negro); el título, su explicación, el contenido y abajo el botón.
 */
export function Pasos(props: Props) {
  return (
    <section class={styles.pantalla} aria-labelledby="paso-titulo">
      <div
        class={styles.barras}
        role="progressbar"
        aria-label={`Paso ${props.paso} de ${props.total}`}
        aria-valuemin={1}
        aria-valuemax={props.total}
        aria-valuenow={props.paso}
      >
        {Array.from({ length: props.total }, (_, i) => (
          <span key={i} class={i < props.paso ? styles.hecha : ''} />
        ))}
      </div>
      <h1 id="paso-titulo" class={`${styles.titulo} appear`}>
        {props.titulo}
      </h1>
      <p class={`${styles.intro} appear`}>{props.intro}</p>
      <div class={`${styles.contenido} appear`}>{props.children}</div>
      <div class={`${styles.pie} appear`}>
        {props.accion}
        {props.secundaria}
      </div>
    </section>
  )
}
