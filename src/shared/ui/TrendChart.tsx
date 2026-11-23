import { formatDecimal } from '../lib/format.ts'
import { useTocarGrafica } from './useTocarGrafica.ts'
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
  /** Tramos con nombre debajo de la línea (las etapas de Progreso): del día `desde` al `hasta`. */
  tramos?: { desde: number; hasta: number; nombre: string }[]
}

const W = 320
const H = 110
const IZQ = 34
const ABAJO = 18

/** El nombre de un tramo si cabe en su ancho (unos 9 por letra, en mayúsculas); si no, su primera palabra; si tampoco, nada. */
function etiqueta(nombre: string, ancho: number): string | null {
  const cabe = (t: string) => t.length * 9 + 8 <= ancho
  const primera = nombre.split(' ')[0]
  return cabe(nombre) ? nombre : cabe(primera) ? primera : null
}

/** La tendencia de tu peso (línea) con los pesajes (puntos) y, si se pide, la banda de lo previsto o los tramos (etapas). */
export function TrendChart({ puntos, dias, banda, desde, hasta, resumen, tramos }: Props) {
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
  // Al tocar: el día más cercano al dedo, con su raya, su punto y su peso
  const { parte, svg } = useTocarGrafica()
  const diaTocado = parte === null ? null : ((parte * W - IZQ) / (W - IZQ - 6)) * Math.max(1, dias - 1)
  const tocado =
    diaTocado === null || !puntos.length
      ? null
      : puntos.reduce((a, b) => (Math.abs(b.dia - diaTocado) < Math.abs(a.dia - diaTocado) ? b : a))
  return (
    <svg class={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={resumen} {...svg}>
      {tramos?.map((t, i) => {
        const [a, b] = [x(Math.max(0, t.desde)), x(Math.min(dias - 1, t.hasta))]
        return (
          b > a && (
            <g key={t.nombre + t.desde}>
              <rect
                class={i % 2 ? styles.tramoOtro : styles.tramo}
                x={a}
                y={0}
                width={b - a}
                height={H - ABAJO}
              />
              {etiqueta(t.nombre, b - a) && (
                <text class={styles.tramoNombre} x={a + 4} y={10}>
                  {etiqueta(t.nombre, b - a)}
                </text>
              )}
            </g>
          )
        )
      })}
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
      {ultimo && !tocado && (
        <circle class={styles.last} cx={x(ultimo.dia)} cy={y(ultimo.tendencia)} r={3.5} />
      )}
      {tocado && (
        <g>
          <line class={styles.tocadoRaya} x1={x(tocado.dia)} x2={x(tocado.dia)} y1={0} y2={H - ABAJO} />
          <circle class={styles.last} cx={x(tocado.dia)} cy={y(tocado.tendencia)} r={4} />
          <text
            class={styles.tocadoTexto}
            x={Math.min(W - 4, Math.max(IZQ + 4, x(tocado.dia)))}
            y={10}
            text-anchor={x(tocado.dia) > W - 60 ? 'end' : x(tocado.dia) < IZQ + 60 ? 'start' : 'middle'}
          >
            {formatDecimal(Math.round(tocado.tendencia * 10) / 10)} kg
          </text>
        </g>
      )}
      <text class={styles.axis} x={IZQ} y={H - 2}>
        {desde}
      </text>
      <text class={styles.axis} x={W} y={H - 2} text-anchor="end">
        {hasta}
      </text>
    </svg>
  )
}
