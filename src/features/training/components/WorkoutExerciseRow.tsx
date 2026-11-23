import { CheckIcon, ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import { TrophyIcon } from '../../../shared/ui/iconosHoy.tsx'
import { Corona, Estrella } from './WorkoutExercise.tsx'
import styles from './WorkoutExercise.module.css'

type RowProps = {
  numero: number
  nombre: string
  /** «3 series de 8–12 reps, RIR 1 · 2:15». */
  detalle: string
  /** Pendiente: nada (o «Cambiado solo para hoy»). Terminado: lo hecho, con ★ en las series récord. */
  resumen: string | null
  /** Con un récord (tu mejor marca de siempre), el trofeo en negro: el naranja, solo en la serie (usuario, 2026-11-20). */
  estado: 'pendiente' | 'hecho' | 'record' | 'corona' | 'trofeo'
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
        {estado === 'trofeo' ? (
          <TrophyIcon />
        ) : estado === 'corona' ? (
          <Corona />
        ) : estado === 'record' ? (
          <Estrella />
        ) : estado === 'hecho' ? (
          <CheckIcon />
        ) : (
          numero
        )}
      </span>
      <span class={styles.text}>
        <span class={styles.name}>
          {nombre}
          {estado !== 'pendiente' && <span class={styles.hidden}>, terminado</span>}
        </span>
        {estado === 'pendiente' && <span class={styles.detail}>{detalle}</span>}
        {/* Terminado y plegado: solo su nombre con ✓ o ★ (usuario, 2026-11-14); pendiente, «Cambiado solo para hoy» si toca */}
        {estado === 'pendiente' && resumen && <span class={styles.detail}>{resumen}</span>}
      </span>
      <span class={styles.chevron} aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </button>
  )
}
