import type { ComponentChildren } from 'preact'
import { formatInt } from '../../../shared/lib/format.ts'
import styles from './TargetHero.module.css'

type Props = {
  /** «DEFINICIÓN · −0,75 % POR SEMANA». */
  etiqueta: string
  kcal: number
  /** «al día», «desde mañana». */
  cuando: string
  macros: { proteina: number; hidratos: number; grasa: number }
  /** Una nota bajo los macros (la de los hidratos de hoy). */
  detalle?: string
  children?: ComponentChildren
  /** Junto a las kcal: la «ⓘ» de cómo se calcula (usuario, 2026-11-19). */
  info?: ComponentChildren
}

/** Tu objetivo (o tu dieta) en grande, en su tarjeta blanca, con sus macros y sus botones. */
export function TargetHero({ etiqueta, kcal, cuando, macros, detalle, children, info }: Props) {
  return (
    <section class={styles.hero} aria-label="Tu objetivo">
      <span class={styles.chip}>{etiqueta}</span>
      <p class={styles.kcal}>
        <span class={styles.number}>{formatInt(kcal)}</span>
        <span class={styles.unit}>kcal {cuando}</span>
        {info}
      </p>
      <p class={styles.macros}>
        <span>
          <b>{formatInt(macros.proteina)} g</b>
          <span>proteína</span>
        </span>
        <span>
          <b>{formatInt(macros.hidratos)} g</b>
          <span>hidratos</span>
        </span>
        <span>
          <b>{formatInt(macros.grasa)} g</b>
          <span>grasa</span>
        </span>
      </p>
      {detalle && <p class={styles.detalle}>{detalle}</p>}
      {children && <div class={styles.actions}>{children}</div>}
    </section>
  )
}
