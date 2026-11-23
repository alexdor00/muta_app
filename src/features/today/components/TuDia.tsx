import { FlameIcon } from '../../../shared/ui/icons.tsx'
import styles from './TuDia.module.css'

type Props = {
  /** «viernes, 13 de noviembre». */
  fecha: string
  total: number
  hechas: number
  /** Lo que queda, en una frase («Entrenar, comer y la compra.»); vacío si no queda nada. */
  queda: string
  /** Días de racha (null o 0: no sale). */
  racha: number | null
  /** Hoy hay un récord: la racha va sin naranja (un solo naranja por pantalla; usuario, 2026-11-20). */
  rachaSinColor?: boolean
  /** Hoy descansas (sin entreno en la lista): se dice debajo. */
  descansas: boolean
}

const R = 38
const VUELTA = 2 * Math.PI * R

/**
 * La tarjeta de arriba de Hoy (blanca, como tu día en Nutrición): un anillo continuo que se llena con lo que haces hoy,
 * cuántas tareas faltan y cuáles, y tu racha. Con todo hecho: el anillo lleno con su ✓ y «Día completo · Todo hecho por hoy».
 */
export function TuDia({ fecha, total, hechas, queda, racha, descansas, rachaSinColor }: Props) {
  const completo = total > 0 && hechas >= total
  const lleno = total > 0 ? (VUELTA * Math.min(hechas, total)) / total : 0
  const faltan = total - hechas
  return (
    <section class={styles.card} aria-labelledby="tu-dia">
      <svg class={styles.anillo} viewBox="0 0 92 92" role="img" aria-label={`${hechas} de ${total} hechas`}>
        <g transform="rotate(-90 46 46)">
          <circle class={styles.vacia} cx="46" cy="46" r={R} />
          {hechas > 0 && (
            <circle class={styles.llena} cx="46" cy="46" r={R} stroke-dasharray={`${lleno} ${VUELTA}`} />
          )}
        </g>
        {completo ? (
          // Todo hecho: el centro, en negro, con su ✓
          <>
            <circle class={styles.centro} cx="46" cy="46" r={R - 10} />
            <path class={styles.tick} d="M33 47l9 9 17-19" />
          </>
        ) : (
          <text class={styles.cuenta} x="46" y="46" text-anchor="middle" dominant-baseline="central">
            {`${hechas}/${total}`}
          </text>
        )}
      </svg>
      <div class={styles.texto}>
        <p class={styles.fecha}>{fecha}</p>
        <h2 id="tu-dia" class={styles.frase}>
          {completo
            ? 'Día completo'
            : total === 0
              ? 'Nada pendiente'
              : `${faltan === 1 ? 'Falta' : 'Faltan'} ${faltan} ${faltan === 1 ? 'tarea' : 'tareas'}`}
        </h2>
        {completo ? (
          <p class={styles.queda}>Todo hecho por hoy.</p>
        ) : (
          (queda || descansas) && (
            <p class={styles.queda}>{[descansas ? 'Hoy descansas.' : '', queda].filter(Boolean).join(' ')}</p>
          )
        )}
        {!!racha && (
          <p class={styles.racha}>
            <span class={`${styles.fuego} ${rachaSinColor ? styles.sinColor : ''}`}>
              <FlameIcon />
            </span>
            {racha} {racha === 1 ? 'día' : 'días'} de racha
          </p>
        )}
      </div>
    </section>
  )
}
