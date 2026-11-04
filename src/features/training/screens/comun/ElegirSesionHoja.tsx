import { ChoiceList } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { anadir, nombresDeSesiones, sesiones } from '../../state/plan.ts'
import type { LibraryExercise } from '../../state/routines.ts'
import { editarSesion } from '../../use-cases/training.ts'

/**
 * «¿En qué sesión va …?»: añade un ejercicio de la biblioteca a la sesión que elijas, al final y para todas las semanas
 * (como Editar rutina), con 3 series y la pauta de la biblioteca. Lo usan la ficha del músculo y la cobertura.
 */
export function ElegirSesionHoja(props: {
  ejercicio: LibraryExercise
  onHecho: (sesion: string) => void
  onClose: () => void
}) {
  const ex = props.ejercicio
  const titulos = nombresDeSesiones(sesiones.value)
  return (
    <Sheet title={`¿En qué sesión va ${ex.name}?`} onClose={props.onClose} large>
      <ChoiceList
        name="anadir-a"
        legend="Sesión"
        options={sesiones.value.map((s) => ({ value: s.sigla, label: titulos[s.sigla] }))}
        value=""
        onChange={(sigla) => {
          const nombres = sesiones.value.find((s) => s.sigla === sigla)?.ejercicios.map((e) => e.nombre) ?? []
          const nuevo = { nombre: ex.name, series: 3, reps: ex.reps, rir: ex.rir, descanso: ex.restSec }
          void editarSesion(sigla, (ed) => anadir(ed, nuevo, nombres))
          props.onHecho(titulos[sigla])
        }}
      />
    </Sheet>
  )
}
