import type { ComponentChildren } from 'preact'
import { ChevronLeftIcon } from './icons.tsx'
import { RoundButton } from './RoundButton.tsx'
import styles from './HeroHeader.module.css'

type Props = {
  title: string
  description?: ComponentChildren
  /** Foto de fondo; sin foto se usa el degradado `tone`. */
  photo?: string
  tone?: 1 | 2 | 3 | 4 | 5 | 6
  backHref: string
  /** Se pasa para saber cuándo deja de verse (barra compacta). */
  heroRef?: { current: HTMLElement | null }
}

/** Cabecera de una categoría o una rutina: foto a todo el ancho y el título encima. */
export function HeroHeader({ title, description, photo, tone = 1, backHref, heroRef }: Props) {
  return (
    <header class={`${styles.hero} ${styles[`t${tone}`]}`} ref={heroRef as never}>
      {photo && <img class={styles.photo} src={photo} alt="" />}
      <div class={styles.scrim} />
      <div class={styles.back}>
        <RoundButton label="Volver" href={backHref}>
          <ChevronLeftIcon />
        </RoundButton>
      </div>
      <div class={`${styles.text} appear`}>
        <h1 class={styles.title}>{title}</h1>
        {description && <p class={styles.description}>{description}</p>}
      </div>
    </header>
  )
}
