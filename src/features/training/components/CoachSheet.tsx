import { Sheet } from '../../../shared/ui/Sheet.tsx'
import { TipList, type ConsejoVisto } from './SessionTips.tsx'
import styles from './CoachSheet.module.css'

/**
 * Los consejos del entrenador para una sesión (desde Editar rutina): numerados, con su porqué en gris y, si se arreglan con
 * un toque, su botón («Añadir abducción en máquina»). Como la pestaña Consejos de la ficha del músculo.
 */
export function CoachSheet(props: { sesion: string; consejos: ConsejoVisto[]; onClose: () => void }) {
  return (
    <Sheet title="Consejos del entrenador" onClose={props.onClose} large>
      <p class={styles.lead}>
        Para {props.sesion}. Salen de las reglas del método: son sugerencias, tu rutina es tuya.
      </p>
      <TipList consejos={props.consejos} />
    </Sheet>
  )
}
