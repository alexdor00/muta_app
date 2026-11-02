import { useId } from 'preact/hooks'
import { formatDecimal, formatShortDate } from '../../../shared/lib/format.ts'
import { ChoiceSegmented } from '../../../shared/ui/Choice.tsx'
import styles from './SessionProgress.module.css'

const METRICAS = [
  { value: 'ton', label: 'Tonelaje' },
  { value: 'reps', label: 'Repeticiones' },
  { value: 'min', label: 'Duración' },
] as const
export type Metrica = (typeof METRICAS)[number]['value']

// Tamaño del dibujo de la gráfica (unidades del SVG; se escala al ancho que tenga sin deformarse)
const W = 300
const H = 160

type Props = {
  /** «7,1 t», o null si aún no hay entrenos de esta sesión. */
  valor: string | null
  /** «−7 % que la anterior» o «Igual que la anterior»; null la primera vez. */
  cambio: string | null
  /** Día del último entreno: «Vie 23 oct». */
  fecha: string | null
  /** Valor de cada entreno (fecha AAAA-MM-DD), el más antiguo primero. */
  puntos: { fecha: string; valor: number }[]
  metrica: Metrica
  onMetrica: (metrica: Metrica) => void
}

/** Marcas del eje vertical: números redondos (1, 2, 5…) que abarcan todos los puntos, con dos tramos como poco. */
function marcas(valores: number[]) {
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const bruto = Math.max(max - min, 1) / 2
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const paso = ([1, 2, 2.5, 5, 10].find((m) => m * potencia >= bruto) ?? 10) * potencia
  const bajo = Math.floor(min / paso) * paso
  const alto = Math.max(Math.ceil(max / paso) * paso, bajo + 2 * paso)
  const lista: number[] = []
  for (let v = alto; v >= bajo - paso / 2; v -= paso) lista.push(Math.round(v * 100) / 100)
  return { bajo, alto, lista }
}

/** Curva suave que pasa por la mitad entre cada par de puntos (no se sale por arriba ni por abajo). */
function curva(xy: (readonly [number, number])[]) {
  if (xy.length < 2) return ''
  let d = `M${xy[0][0]},${xy[0][1]}`
  for (let i = 1; i < xy.length - 1; i++) {
    const [x, y] = xy[i]
    const [nx, ny] = xy[i + 1]
    d += ` Q${x},${y} ${(x + nx) / 2},${(y + ny) / 2}`
  }
  const [lx, ly] = xy[xy.length - 1]
  return `${d} L${lx},${ly}`
}

/**
 * «Progreso de la sesión» (como la gráfica del prototipo anterior): el último valor en grande, cuánto cambió, su
 * fecha y la gráfica con su eje, el área sombreada y las fechas de inicio y fin; debajo, Tonelaje · Repeticiones ·
 * Duración.
 */
export function SessionProgress({ valor, cambio, fecha, puntos, metrica, onMetrica }: Props) {
  const degradado = useId()
  const nombre = METRICAS.find((m) => m.value === metrica)?.label ?? ''
  const { bajo, alto, lista } = marcas(puntos.length ? puntos.map((p) => p.valor) : [0])
  const y = (v: number) => ((alto - v) / (alto - bajo)) * H
  const xy = puntos.map(
    (p, i) => [puntos.length < 2 ? W : (i / (puntos.length - 1)) * W, y(p.valor)] as const,
  )
  const linea = curva(xy)
  const ultimo = xy.at(-1)
  return (
    <section class={styles.card} aria-label="Progreso de la sesión">
      <div class={styles.head}>
        <p class={styles.value}>{valor ?? '—'}</p>
        {cambio && <p class={styles.change}>{cambio}</p>}
        {fecha && <p class={styles.date}>{fecha}</p>}
      </div>
      {puntos.length ? (
        <div class={styles.chart}>
          <div class={styles.axis} aria-hidden="true">
            {lista.map((m) => (
              <span key={m} style={{ top: `${((alto - m) / (alto - bajo)) * 100}%` }}>
                {formatDecimal(m)}
              </span>
            ))}
          </div>
          <svg
            key={metrica}
            class={styles.plot}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`${nombre} de ${puntos.length} ${puntos.length === 1 ? 'entreno' : 'entrenos'}`}
          >
            <defs>
              <linearGradient id={degradado} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" class={styles.shadeTop} />
                <stop offset="1" class={styles.shadeBottom} />
              </linearGradient>
            </defs>
            {lista.map((m) => (
              <line key={m} class={styles.grid} x1="0" x2={W} y1={y(m)} y2={y(m)} />
            ))}
            {linea && (
              <path class={styles.area} fill={`url(#${degradado})`} d={`${linea} L${W},${H} L0,${H} Z`} />
            )}
            {linea && <path class={styles.line} d={linea} pathLength={1} />}
            {ultimo && <circle class={styles.dot} cx={ultimo[0]} cy={ultimo[1]} r="5" />}
          </svg>
          <div class={`${styles.dates} ${puntos.length < 2 ? styles.single : ''}`} aria-hidden="true">
            <span>{formatShortDate(puntos[0].fecha)}</span>
            {puntos.length > 1 && <span>{formatShortDate(puntos[puntos.length - 1].fecha)}</span>}
          </div>
        </div>
      ) : (
        <p class={styles.empty}>Aún no has hecho esta sesión.</p>
      )}
      <div class={styles.metrics}>
        <ChoiceSegmented
          name="metrica"
          legend="Qué enseña la gráfica"
          options={[...METRICAS]}
          value={metrica}
          onChange={onMetrica}
        />
      </div>
    </section>
  )
}
