import type { ComponentChildren, RefObject } from 'preact'
import { ChevronLeftIcon } from './icons.tsx'
import { RoundButton } from './RoundButton.tsx'
import styles from './HeroHeader.module.css'
import { useVolver } from './useVolver.ts'

type Props = {
  title: string
  description?: ComponentChildren
  /** Foto de fondo; sin foto se usa el degradado `tone`. */
  photo?: string
  tone?: 1 | 2 | 3 | 4 | 5 | 6
  backHref: string
  /** Se pasa para saber cuándo deja de verse (barra compacta). */
  heroRef?: RefObject<HTMLElement | null>
  /** Botón redondo arriba a la derecha (p. ej. la «!» de información). */
  action?: ComponentChildren
}

/** Cabecera de una categoría o una rutina: foto a todo el ancho y el título encima. */
export function HeroHeader({ title, description, photo, tone = 1, backHref, heroRef, action }: Props) {
  // «‹»: a la pantalla de la que vienes (o a `backHref` si entraste directamente)
  const atras = useVolver(backHref)
  return (
    <header class={`${styles.hero} ${styles[`t${tone}`]}`} ref={heroRef}>
      {photo && <img class={styles.photo} src={photo} alt="" />}
      <div class={styles.scrim} />
      <div class={styles.back}>
        <RoundButton label="Volver" onClick={atras}>
          <ChevronLeftIcon />
        </RoundButton>
      </div>
      {action && <div class={styles.action}>{action}</div>}
      <div class={`${styles.text} appear`}>
        <h1 class={styles.title}>{title}</h1>
        {description && <p class={styles.description}>{description}</p>}
      </div>
    </header>
  )
}
