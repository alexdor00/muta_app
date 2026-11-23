import styles from './LetraMenu.module.css'

const TONOS = [styles.m1, styles.m2, styles.m3, styles.m4, styles.m5, styles.m6, styles.m7]

/**
 * La letra de un menú (A, B, C…) en su color suave (Plan, usuario 2026-11-18): el mismo en la tira de días, tu dieta, el
 * día y Cómo cocinas. `indice` es su sitio entre tus menús; `tam`: pequeña (en una tira), etiqueta («Menú A») o grande.
 */
export function LetraMenu(props: {
  id: string
  indice: number
  tam?: 'pequena' | 'etiqueta' | 'grande'
  elegida?: boolean
}) {
  const tam = props.tam ?? 'pequena'
  return (
    <span
      class={`${styles.letra} ${styles[tam]} ${TONOS[Math.max(0, props.indice) % TONOS.length]} ${props.elegida ? styles.elegida : ''}`}
    >
      {tam === 'etiqueta' ? `Menú ${props.id}` : props.id}
    </span>
  )
}
