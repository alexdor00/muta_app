import { ChevronRightIcon } from '../../../shared/ui/icons.tsx'
import { TrophyIcon } from '../../../shared/ui/iconosHoy.tsx'
import styles from './RecordsHoy.module.css'

/** «Sentadilla hack, remo y jalón». */
const enLista = (xs: string[]) =>
  xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`

/**
 * Los récords de hoy (tu mejor marca de siempre en un ejercicio; usuario, 2026-11-20): una tarjeta con el trofeo en
 * naranja, el único naranja de Hoy ese día (la racha va sin color). Lleva a ese día en Progreso. Mañana ya no sale.
 */
export function RecordsHoy({ records, href }: { records: string[]; href: string }) {
  if (!records.length) return null
  return (
    <a class={styles.tarjeta} href={href}>
      <span class={styles.trofeo} aria-hidden="true">
        <TrophyIcon />
      </span>
      <span class={styles.texto}>
        <b>
          {records.length} {records.length === 1 ? 'récord hoy' : 'récords hoy'}
        </b>
        <small>{enLista(records)}</small>
      </span>
      <ChevronRightIcon />
    </a>
  )
}
