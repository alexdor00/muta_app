import type { ComponentChildren } from 'preact'
import styles from './ListRow.module.css'

type Props = {
  title: string
  /** Líneas grises bajo el título («Volumen medio · Cuerpo completo», «4 días · ~55 min»). */
  lines: string[]
  /** Texto pequeño en color sobre el título («Para ti»). */
  eyebrow?: string
  href: string
  photo?: string
  tone?: 1 | 2 | 3 | 4 | 5 | 6
  /** Sin foto: texto grande en la miniatura (p. ej. «4» y «días»). */
  thumbBig?: string
  thumbSmall?: string
  /** Acción a la derecha (p. ej. guardar). */
  trailing?: ComponentChildren
}

/** Fila de una lista de rutinas o entrenamientos (miniatura, título, datos). */
export function ListRow({
  title,
  lines,
  eyebrow,
  href,
  photo,
  tone = 1,
  thumbBig,
  thumbSmall,
  trailing,
}: Props) {
  return (
    <li class={styles.row}>
      <a class={styles.link} href={href}>
        <span class={`${styles.thumb} ${styles[`t${tone}`]}`} aria-hidden="true">
          {photo ? (
            <img src={photo} alt="" loading="lazy" />
          ) : (
            <span class={styles.thumbText}>
              <span class={styles.thumbBig}>{thumbBig}</span>
              <span class={styles.thumbSmall}>{thumbSmall}</span>
            </span>
          )}
        </span>
        <span class={styles.body}>
          {eyebrow && <span class={styles.eyebrow}>{eyebrow}</span>}
          <span class={styles.title}>{title}</span>
          {lines.map((line) => (
            <span key={line} class={styles.line}>
              {line}
            </span>
          ))}
        </span>
      </a>
      <span class={styles.trailing}>{trailing}</span>
    </li>
  )
}
