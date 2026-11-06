import { formatDayDate, localDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { HoyDeComida } from '../../../nutrition/index.ts'
import styles from './Hoy.module.css'

/**
 * Hoy: de momento, lo de Comida (tu peso y lo de hoy con hora). El resto de Hoy se programará con su propio diseño
 * aprobado (ver TAREAS.md).
 */
export function HoyScreen() {
  return (
    <>
      <ScreenHeader
        title="Hoy"
        avatarHref={paths.profile}
        inline
        action={<span class={styles.fecha}>{formatDayDate(localDate())}</span>}
      />
      <HoyDeComida />
    </>
  )
}
