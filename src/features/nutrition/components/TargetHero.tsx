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
  /** Una línea más bajo los macros («1.780 kcal los días de descanso»). */
  detalle?: string
  children?: ComponentChildren
}

/** Tu objetivo (o tu dieta) en grande, en la tarjeta negra, con sus macros y sus botones. */
export function TargetHero({ etiqueta, kcal, cuando, macros, detalle, children }: Props) {
  return (
    <section class={styles.hero} aria-label="Tu objetivo">
      <span class={styles.chip}>{etiqueta}</span>
      <p class={styles.kcal}>
        <span class={styles.number}>{formatInt(kcal)}</span>
        <span class={styles.unit}>
          kcal
          <br />
          {cuando}
        </span>
      </p>
      <p class={styles.macros}>
        <span>
          <b>{formatInt(macros.proteina)} g</b> prot.
        </span>
        <span>
          <b>{formatInt(macros.hidratos)} g</b> hidr.
        </span>
        <span>
          <b>{formatInt(macros.grasa)} g</b> grasa
        </span>
      </p>
      {detalle && <p class={styles.macros}>{detalle}</p>}
      {children && <div class={styles.actions}>{children}</div>}
    </section>
  )
}
