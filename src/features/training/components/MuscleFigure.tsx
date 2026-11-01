import { BACK, FRONT } from './bodyParts.ts'
import styles from './MuscleFigure.module.css'

/**
 * Qué músculos nuestros (MuscleId) pinta cada pieza del dibujo. Una pieza sin lista es un músculo que
 * aún no seguimos (lumbar, tibial); la cabeza, las manos o los pies no son músculos: solo dan forma al cuerpo.
 */
const IDS: Record<string, string[]> = {
  chest: ['pecho'],
  obliques: ['core'],
  abs: ['core'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearm: ['antebrazo'],
  deltoids: ['hombro_ant', 'hombro_lat', 'hombro_post'],
  trapezius: ['espalda_alta'],
  'upper-back': ['dorsal'],
  gluteal: ['gluteo'],
  adductors: ['aductores'],
  hamstring: ['femoral'],
  quadriceps: ['cuadriceps'],
  calves: ['gemelo'],
  neck: ['cuello'],
}

/** Nuestros músculos (MuscleId) de una pieza del dibujo; vacío si no se sigue. */
export function musclesOfPart(part: string): string[] {
  return IDS[part] ?? []
}

/** Nombre de una pieza: el de su músculo, o «Hombros» para el deltoides (anterior, lateral y posterior juntos). */
export function partName(part: string, names: Record<string, string>): string {
  const ids = musclesOfPart(part)
  return ids.length > 1 ? 'Hombros' : (names[ids[0]] ?? ids[0] ?? part)
}

type Props = {
  side: 'front' | 'back'
  /** Pieza tocada (p. ej. «biceps»), que se marca con un borde; null si ninguna. */
  selected: string | null
  /**
   * Avisa al tocar una pieza que es un músculo que seguimos, con la pieza tocada para colocar al lado lo que se
   * enseñe; con null al tocar la misma otra vez o fuera de los músculos.
   */
  onSelect: (part: string | null, anchor?: Element) => void
  /** Series de cada músculo en el periodo que se ve; los que no están, o con 0, no se marcan. */
  series: Record<string, number>
  /** Nombre de cada músculo (por su id) para el lector de pantalla. */
  names: Record<string, string>
}

/**
 * Dibujo del cuerpo, de frente o de espalda. Los músculos con más series (la mitad o más que el que más)
 * van en negro; los demás trabajados, en gris medio; el resto, en gris muy claro.
 */
export function MuscleFigure({ side, selected, onSelect, series, names }: Props) {
  const { viewBox, outline, parts } = side === 'front' ? FRONT : BACK
  const seriesOf = (muscle: string) => Math.max(0, ...(IDS[muscle] ?? []).map((id) => series[id] ?? 0))
  const top = Math.max(0, ...Object.values(series))
  const classOf = (muscle: string) => {
    if (muscle === 'hair') return styles.hair
    const n = seriesOf(muscle)
    if (n <= 0) return styles.muscle
    return n * 2 >= top ? styles.on : styles.some
  }
  const worked = [...new Set(parts.flatMap((p) => IDS[p.muscle] ?? []).filter((id) => (series[id] ?? 0) > 0))]
  const label = worked.length
    ? `Músculos trabajados, ${side === 'front' ? 'de frente' : 'de espalda'}: ${worked
        .map((id) => `${names[id] ?? id}, ${series[id]} series`)
        .join('; ')}`
    : `Músculos, ${side === 'front' ? 'de frente' : 'de espalda'}: ninguno trabajado`
  const toggle = (part: string, anchor: Element) =>
    part === selected ? onSelect(null) : onSelect(part, anchor)
  return (
    <svg
      class={styles.figure}
      viewBox={viewBox}
      role="group"
      aria-label={label}
      onClick={() => onSelect(null)}
    >
      <path class={styles.outline} d={outline} />
      {parts.map((part) => {
        const cls = classOf(part.muscle)
        const paths = part.paths.map((d) => <path key={d} class={cls} d={d} />)
        const ids = IDS[part.muscle]
        if (!ids) return <g key={part.muscle}>{paths}</g>
        const n = seriesOf(part.muscle)
        return (
          <g
            key={part.muscle}
            class={`${styles.part} ${part.muscle === selected ? styles.selected : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={part.muscle === selected}
            aria-label={`${partName(part.muscle, names)}: ${n > 0 ? `${n} series` : 'sin series'}`}
            onClick={(event) => {
              event.stopPropagation()
              // la burbuja va sobre el trozo tocado (un brazo), no sobre los dos
              toggle(part.muscle, event.target instanceof Element ? event.target : event.currentTarget)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                toggle(part.muscle, event.currentTarget)
              }
            }}
          >
            {paths}
          </g>
        )
      })}
    </svg>
  )
}
