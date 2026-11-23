import { formatChange } from '../../../../shared/lib/format.ts'
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { SessionProgress } from '../../../../shared/ui/SessionProgress.tsx'
import type { PuntoGrafica } from '../../state/progreso.ts'
import { TrophyIcon } from '../../../../shared/ui/iconosHoy.tsx'
import styles from './Progreso.module.css'

/**
 * Una gráfica con el estilo de Entreno (`SessionProgress`, la de Ver sesión y la ficha): la cifra grande, su cambio y su
 * fecha arriba, y la curva con su eje, el área sombreada y las fechas de inicio y fin.
 */
export function Grafica(props: {
  /** Nombre de la tarjeta para el lector de pantalla. */
  etiqueta: string
  titulo?: string
  valor: string | null
  cambio?: string | null
  fecha?: string | null
  puntos: PuntoGrafica[]
  resumen: string
  /** Cómo se escribe un punto al pasar el dedo («62,5 kg»). */
  texto?: (v: number) => string
}) {
  return (
    <SessionProgress
      metricas={[{ value: 'v', label: props.titulo ?? props.etiqueta }]}
      metrica="v"
      etiqueta={props.etiqueta}
      titulo={props.titulo}
      vacio="Aún sin datos."
      valor={props.valor}
      cambio={props.cambio ?? null}
      fecha={props.fecha ?? null}
      puntos={props.puntos.map((x) => ({ fecha: x.date, valor: x.v }))}
      resumen={props.resumen}
      texto={props.texto}
    />
  )
}

/** Una fila que abre una hoja: título, detalle y «›» (en una lista plana, como los ejercicios de Ver sesión). */
export function FilaHoja(props: { titulo: string; detalle: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" class={styles.filaPlana} onClick={props.onClick}>
        <span class={styles.filaTexto}>
          <span class={styles.filaTitulo}>{props.titulo}</span>
          <span class={styles.filaDetalle}>{props.detalle}</span>
        </span>
        <ChevronRightIcon />
      </button>
    </li>
  )
}

/**
 * Un cambio en % como en Ver sesión: en verde (flecha y número) si sube y la flecha gris si baja, sin signo; «=» si no cambia.
 * `que` dice frente a qué, para el lector de pantalla («la vez anterior», «octubre»).
 */
export function Cambio({ cambio, que }: { cambio: number | null; que: string }) {
  if (cambio === null) return null
  const r = Math.round(cambio * 100)
  if (r === 0)
    return (
      <span class={styles.cambio}>
        <span aria-hidden="true">=</span>
        <span class={styles.oculto}>Igual que {que}</span>
      </span>
    )
  const texto = formatChange(Math.abs(cambio), 0).replace(/^[+−]/, '')
  return (
    <span class={`${styles.cambio} ${r > 0 ? styles.sube : styles.baja}`}>
      {r > 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
      <span aria-hidden="true">{texto}</span>
      <span class={styles.oculto}>
        {r > 0 ? 'Sube' : 'Baja'} {texto} frente a {que}
      </span>
    </span>
  )
}

/** El título de una sección, como «Comidas» en Nutrición: grande, con su dato a la derecha. */
export function TituloSeccion({ titulo, dato, id }: { titulo: string; dato?: string | null; id?: string }) {
  return (
    <div class={styles.seccionCab}>
      <h2 id={id}>{titulo}</h2>
      {dato && <span>{dato}</span>}
    </div>
  )
}

/** «Récord» junto a un ejercicio: píldora negra con su trofeo (es historia; el naranja, solo el día que lo consigues). */
export function Record() {
  return (
    <span class={styles.record}>
      <TrophyIcon />
      Récord
    </span>
  )
}
