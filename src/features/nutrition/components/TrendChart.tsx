import { formatDecimal } from '../../../shared/lib/format.ts'
import styles from './TrendChart.module.css'

export type PuntoTendencia = {
  /** Día desde el primero del gráfico (0, 1, 2…). */
  dia: number
  /** El pesaje de ese día, si lo hubo (punto gris). */
  kg: number | null
  tendencia: number
}

type Props = {
  puntos: PuntoTendencia[]
  /** Días que abarca el gráfico (eje horizontal). */
  dias: number
  /** Banda de lo previsto: de dónde a dónde iría el peso al ritmo de tu fase. */
  banda?: { inicio: [number, number]; fin: [number, number] }
  desde: string
  hasta: string
  /** Lo que lee el lector de pantalla. */
  resumen: string
}

const W = 320
const H = 110
const IZQ = 34
const ABAJO = 18

/** La tendencia de tu peso (línea) con los pesajes (puntos) y, si se pide, la banda de lo previsto. */
export function TrendChart({ puntos, dias, banda, desde, hasta, resumen }: Props) {
  const valores = [
    ...puntos.flatMap((p) => (p.kg === null ? [p.tendencia] : [p.kg, p.tendencia])),
    ...(banda ? [...banda.inicio, ...banda.fin] : []),
  ]
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const hueco = Math.max(0.2, (max - min) * 0.1)
  const [lo, hi] = [min - hueco, max + hueco]
  const x = (dia: number) => IZQ + (dia / Math.max(1, dias - 1)) * (W - IZQ - 6)
  const y = (kg: number) => 6 + ((hi - kg) / (hi - lo)) * (H - ABAJO - 12)
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(p.dia)},${y(p.tendencia)}`).join('')
  const ultimo = puntos.at(-1)
  return (
    <svg class={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resumen}>
      {[hi - hueco, lo + hueco].map((v) => (
        <g key={v}>
          <line class={styles.grid} x1={IZQ} x2={W} y1={y(v)} y2={y(v)} />
          <text class={styles.axis} x={0} y={y(v) + 4}>
            {formatDecimal(Math.round(v * 10) / 10)}
          </text>
        </g>
      ))}
      {banda && (
        <path
          class={styles.band}
          d={`M${x(0)},${y(banda.inicio[0])} L${x(dias - 1)},${y(banda.fin[0])} L${x(dias - 1)},${y(banda.fin[1])} L${x(0)},${y(banda.inicio[1])} Z`}
        />
      )}
      {puntos.map(
        (p) => p.kg !== null && <circle key={p.dia} class={styles.dot} cx={x(p.dia)} cy={y(p.kg)} r={3} />,
      )}
      <path class={styles.line} d={linea} />
      {ultimo && <circle class={styles.last} cx={x(ultimo.dia)} cy={y(ultimo.tendencia)} r={4.5} />}
      <text class={styles.axis} x={IZQ} y={H - 2}>
        {desde}
      </text>
      <text class={styles.axis} x={W} y={H - 2} text-anchor="end">
        {hasta}
      </text>
    </svg>
  )
}
