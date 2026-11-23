import styles from './Sparkline.module.css'

type Props = {
  /** Los valores, del más antiguo al último. */
  valores: readonly number[]
  /** Lo que lee el lector de pantalla; sin él, la gráfica es decorativa. */
  resumen?: string
}

const W = 64
const H = 24

/** Mini-gráfica de una línea con el último punto marcado (tus medidas, tu recuperación); con uno solo, una raya. */
export function Sparkline({ valores, resumen }: Props) {
  const a11y = resumen ? { role: 'img' as const, 'aria-label': resumen } : { 'aria-hidden': true }
  if (valores.length < 2)
    return (
      <svg class={styles.spark} viewBox={`0 0 ${W} ${H}`} {...a11y}>
        <line class={styles.vacia} x1="2" x2={W - 2} y1={H / 2} y2={H / 2} />
      </svg>
    )
  const lo = Math.min(...valores)
  const hi = Math.max(...valores)
  const alto = hi - lo || 1
  const puntos = valores.map((v, i) => [
    2 + (i * (W - 4)) / (valores.length - 1),
    H - 3 - ((v - lo) / alto) * (H - 6),
  ])
  const [x, y] = puntos.at(-1) ?? [0, 0]
  return (
    <svg class={styles.spark} viewBox={`0 0 ${W} ${H}`} {...a11y}>
      <polyline
        class={styles.linea}
        points={puntos.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}
      />
      <circle class={styles.punto} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.6" />
    </svg>
  )
}
