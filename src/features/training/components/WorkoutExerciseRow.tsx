import { CheckIcon, ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import { Estrella } from './WorkoutExercise.tsx'
import styles from './WorkoutExercise.module.css'

type RowProps = {
  numero: number
  nombre: string
  /** «3 series de 8–12 reps, a 1 del fallo · 2:15». */
  detalle: string
  /** Pendiente: «Hoy 24 kg · antes 22 kg × 12». Terminado: lo hecho, con ★ en las series récord. */
  resumen: string
  estado: 'pendiente' | 'hecho' | 'record'
  onAbrir: () => void
}

/** Un ejercicio que no se está haciendo: al tocarlo pasa a ser el abierto. Terminado, lleva ✓ o ★ (C22). */
export function WorkoutExerciseRow({ numero, nombre, detalle, resumen, estado, onAbrir }: RowProps) {
  return (
    <button
      type="button"
      class={`${styles.exercise} ${styles.row} ${estado !== 'pendiente' ? styles.finished : ''}`}
      onClick={onAbrir}
    >
      <span class={styles.badge} aria-hidden="true">
        {estado === 'record' ? <Estrella /> : estado === 'hecho' ? <CheckIcon /> : numero}
      </span>
      <span class={styles.text}>
        <span class={styles.name}>
          {nombre}
          {estado !== 'pendiente' && <span class={styles.hidden}>, terminado</span>}
        </span>
        <span class={styles.detail}>{detalle}</span>
        <span class={`${styles.detail} ${estado !== 'pendiente' ? styles.summary : ''}`}>{resumen}</span>
      </span>
      <span class={styles.chevron} aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>
  )
}
