import { useId } from 'preact/hooks'
import { formatDecimal, formatShortDate } from '../../../shared/lib/format.ts'
import { ChoiceSegmented } from '../../../shared/ui/Choice.tsx'
import styles from './SessionProgress.module.css'

/** Lo que enseña la gráfica de una sesión (Ver sesión). */
export const METRICAS_SESION = [
  { value: 'ton', label: 'Tonelaje' },
  { value: 'reps', label: 'Repeticiones' },
  { value: 'min', label: 'Duración' },
] as const
export type Metrica = (typeof METRICAS_SESION)[number]['value']

// Tamaño del dibujo de la gráfica (unidades del SVG; se escala al ancho que tenga sin deformarse)
const W = 300
const H = 160

type Props<M extends string> = {
  /** Qué se puede enseñar (Tonelaje · Repeticiones · Duración en una sesión; Máximo · Volumen en un ejercicio). */
  metricas: readonly { value: M; label: string }[]
  /** Nombre de la tarjeta para el lector de pantalla, y el texto si aún no hay ningún entreno. */
  etiqueta: string
  vacio: string
  /** «7,1 t», o null si aún no hay entrenos. */
  valor: string | null
  /** «−7 % que la anterior» o «Igual que la anterior»; null la primera vez. */
  cambio: string | null
  /** Día del último entreno: «Vie 23 oct». */
  fecha: string | null
  /** Valor de cada entreno (fecha AAAA-MM-DD), el más antiguo primero. */
  puntos: { fecha: string; valor: number }[]
  metrica: M
  onMetrica: (metrica: M) => void
  /** Los puntos hechos en otro puesto de la sesión que el último (se marcan con un círculo hueco). */
  otroPuesto?: boolean[]
  /** Advertencia bajo la cifra: «La última vez lo hiciste en otro puesto…». */
  aviso?: string | null
  /** Título arriba («1RM estimado»), cuando la tarjeta enseña una sola medida. */
  titulo?: string
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
 * Progreso de una sesión o de un ejercicio (como la gráfica del prototipo anterior): el último valor en grande, cuánto
 * cambió, su fecha y la gráfica con su eje, el área sombreada y las fechas de inicio y fin; debajo, qué enseña.
 */
export function SessionProgress<M extends string>({
  metricas,
  etiqueta,
  vacio,
  valor,
  cambio,
  fecha,
  puntos,
  metrica,
  onMetrica,
  otroPuesto = [],
  aviso = null,
  titulo,
}: Props<M>) {
  const degradado = useId()
  const nombre = metricas.find((m) => m.value === metrica)?.label ?? ''
  const { bajo, alto, lista } = marcas(puntos.length ? puntos.map((p) => p.valor) : [0])
  const y = (v: number) => ((alto - v) / (alto - bajo)) * H
  const xy = puntos.map(
    (p, i) => [puntos.length < 2 ? W : (i / (puntos.length - 1)) * W, y(p.valor)] as const,
  )
  const linea = curva(xy)
  const ultimo = xy.at(-1)
  return (
    <section class={styles.card} aria-label={etiqueta}>
      {titulo && <h3 class={styles.title}>{titulo}</h3>}
      <div class={styles.head}>
        <p class={styles.value}>{valor ?? '—'}</p>
        {cambio && <p class={styles.change}>{cambio}</p>}
        {fecha && <p class={styles.date}>{fecha}</p>}
      </div>
      {aviso && (
        <p class={styles.warning} role="note">
          {aviso}
        </p>
      )}
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
            {xy.map(([x, yy], i) =>
              otroPuesto[i] ? <circle key={i} class={styles.otherDot} cx={x} cy={yy} r="4" /> : null,
            )}
            {ultimo && <circle class={styles.dot} cx={ultimo[0]} cy={ultimo[1]} r="5" />}
          </svg>
          <div class={`${styles.dates} ${puntos.length < 2 ? styles.single : ''}`} aria-hidden="true">
            <span>{formatShortDate(puntos[0].fecha)}</span>
            {puntos.length > 1 && <span>{formatShortDate(puntos[puntos.length - 1].fecha)}</span>}
          </div>
          {otroPuesto.some(Boolean) && (
            <p class={styles.legend}>
              <span class={styles.legendDot} aria-hidden="true" />
              Hecho en otro puesto de la sesión
            </p>
          )}
        </div>
      ) : (
        <p class={styles.empty}>{vacio}</p>
      )}
      {metricas.length > 1 && (
        <div class={styles.metrics}>
          <ChoiceSegmented
            name="metrica"
            legend="Qué enseña la gráfica"
            options={[...metricas]}
            value={metrica}
            onChange={onMetrica}
          />
        </div>
      )}
    </section>
  )
}
