import { MyTipsSheet } from '../../components/MyTipsSheet.tsx'
import { consejosAlEmpezar } from '../../state/ordenHoy.ts'
import {
  anadirConsejo,
  borrarConsejo,
  editarConsejo,
  ocultarConsejo,
  todosMisConsejos,
} from '../../use-cases/myTips.ts'

/** Mis consejos (desde «Tu rutina»): tus cambios a los consejos de antes de empezar; se guardan solos. */
export function MisConsejosHoja({ onClose }: { onClose: () => void }) {
  return (
    <MyTipsSheet
      consejos={todosMisConsejos.value}
      alEmpezar={consejosAlEmpezar.value}
      onAlEmpezar={(v) => (consejosAlEmpezar.value = v)}
      onVer={(clave, ver) => ocultarConsejo(clave, !ver)}
      onEditar={editarConsejo}
      onAnadir={(t) => anadirConsejo(t)}
      onBorrar={borrarConsejo}
      onClose={onClose}
    />
  )
}
