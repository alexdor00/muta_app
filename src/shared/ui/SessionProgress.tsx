import type { ComponentChildren } from 'preact'
import { useId } from 'preact/hooks'
import { formatDayDate, formatDecimal, formatShortDate } from '../lib/format.ts'
import { ChoiceSegmented } from './Choice.tsx'
import { useTocarGrafica } from './useTocarGrafica.ts'
import styles from './SessionProgress.module.css'

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
  /** Valor de cada entreno (fecha AAAA-MM-DD), el más antiguo primero; `nota`, lo que sale al pasar el dedo por él. */
  puntos: { fecha: string; valor: number; nota?: string }[]
  metrica: M
  /** Sin él (una sola medida), no se elige qué enseña. */
  onMetrica?: (metrica: M) => void
  /** Los puntos hechos en otro puesto de la sesión que el último (se marcan con un círculo hueco). */
  otroPuesto?: boolean[]
  /** Advertencia bajo la cifra: «La última vez lo hiciste en otro puesto…». */
  aviso?: string | null
  /** Título arriba («1RM estimado»), cuando la tarjeta enseña una sola medida. */
  titulo?: string
  /** Lo que lee el lector de pantalla de la gráfica; de serie, «Tonelaje de 8 entrenos». */
  resumen?: string
  /** Cómo se escribe un valor al pasar el dedo por la gráfica («5,5 t»); de serie, el número con un decimal. */
  texto?: (v: number) => string
  /** Lo que va debajo de la gráfica, dentro de la tarjeta («Tu récord · 127 kg» en la ficha). */
  pie?: ComponentChildren
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

/**
 * Curva suave que pasa justo por cada punto y no se pasa de ellos (cúbica monótona, Fritsch–Carlson): el punto que tocas
 * cae siempre sobre la línea (usuario, 2026-11-23: con la de antes, que cortaba por la mitad entre puntos, se salía).
 */
export function curva(xy: readonly (readonly [number, number])[]): string {
  const n = xy.length
  if (n < 2) return ''
  const dx = (i: number) => xy[i + 1][0] - xy[i][0]
  const pend = Array.from({ length: n - 1 }, (_, i) => (dx(i) ? (xy[i + 1][1] - xy[i][1]) / dx(i) : 0))
  // La pendiente en cada punto: 0 en los picos y valles (así no se sale), la media armónica en lo demás
  const t = xy.map((_, i) => {
    if (i === 0) return pend[0]
    if (i === n - 1) return pend[n - 2]
    const a = pend[i - 1]
    const b = pend[i]
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b)
  })
  let d = `M${xy[0][0]},${xy[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = xy[i]
    const [x1, y1] = xy[i + 1]
    const h = (x1 - x0) / 3
    d += ` C${x0 + h},${y0 + t[i] * h} ${x1 - h},${y1 - t[i + 1] * h} ${x1},${y1}`
  }
  return d
}

/**
 * Progreso de una sesión, de un ejercicio o de una medida de Progreso (como la gráfica del prototipo anterior): el último valor en grande, cuánto
 * cambió, su fecha y la gráfica con su eje, el área sombreada y las fechas de inicio y fin; debajo, qué enseña.
 */
/** «+9 % desde la primera vez»: si sube, solo la cifra en verde; la frase, sin color (usuario, 2026-11-20). */
function conCifraVerde(cambio: string) {
  const m = /^(\+[^a-záéíóúñ]*[^a-záéíóúñ\s])\s+(\S.*)$/i.exec(cambio)
  if (!m) return cambio
  return (
    <>
      <span class={styles.sube}>{m[1]}</span> {m[2]}
    </>
  )
}

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
  resumen,
  texto = (v) => formatDecimal(Math.round(v * 10) / 10),
  pie,
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
  // Al pasar el dedo (o el ratón) por la gráfica: la sesión más cercana, con su valor y su fecha arriba
  const { parte, svg } = useTocarGrafica()
  const sel = parte !== null && puntos.length > 1 ? Math.round(parte * (puntos.length - 1)) : null
  const elegido = sel !== null && puntos[sel] ? sel : null
  return (
    <section class={styles.card} aria-label={etiqueta}>
      {titulo && <h3 class={styles.title}>{titulo}</h3>}
      <div class={styles.head}>
        <p class={styles.value}>{elegido !== null ? texto(puntos[elegido].valor) : (valor ?? '—')}</p>
        {elegido !== null ? (
          <p class={styles.change}>{puntos[elegido].nota ?? `Sesión ${elegido + 1} de ${puntos.length}`}</p>
        ) : (
          cambio && <p class={styles.change}>{conCifraVerde(cambio)}</p>
        )}
        {(elegido !== null || fecha) && (
          <p class={styles.date}>{elegido !== null ? formatDayDate(puntos[elegido].fecha) : fecha}</p>
        )}
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
            {...svg}
            aria-label={
              resumen ?? `${nombre} de ${puntos.length} ${puntos.length === 1 ? 'entreno' : 'entrenos'}`
            }
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
            {elegido !== null ? (
              <>
                <line class={styles.guia} x1={xy[elegido][0]} x2={xy[elegido][0]} y1="0" y2={H} />
                <circle class={styles.dot} cx={xy[elegido][0]} cy={xy[elegido][1]} r="3.5" />
              </>
            ) : (
              ultimo && <circle class={styles.dot} cx={ultimo[0]} cy={ultimo[1]} r="3.5" />
            )}
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
      {pie}
      {metricas.length > 1 && onMetrica && (
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
