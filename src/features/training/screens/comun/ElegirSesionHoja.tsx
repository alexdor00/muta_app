import { ChoiceList } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { anadir, nombresDeSesiones, quitar, sesiones } from '../../state/plan.ts'
import type { LibraryExercise } from '../../state/routines.ts'
import { idPorNombre } from '../../use-cases/exerciseLibrary.ts'
import { editarSesion } from '../../use-cases/training.ts'

/**
 * «¿En qué sesión va …?»: añade un ejercicio de la biblioteca a la sesión que elijas, al final y para todas las semanas
 * (como Editar rutina), con 3 series y la pauta de la biblioteca. La que ya lo lleva lo dice y no se repite. Lo usan la
 * ficha del músculo, la cobertura y el «···» de la ficha del ejercicio.
 */
export function ElegirSesionHoja(props: {
  ejercicio: LibraryExercise
  /** El nombre de la sesión y cómo deshacerlo (sin él, ya lo llevaba). */
  onHecho: (sesion: string, deshacer?: () => void) => void
  onClose: () => void
}) {
  const ex = props.ejercicio
  const titulos = nombresDeSesiones(sesiones.value)
  const loLleva = (sigla: string) =>
    !!sesiones.value.find((s) => s.sigla === sigla)?.ejercicios.some((e) => idPorNombre(e.nombre) === ex.id)
  return (
    <Sheet title={`¿En qué sesión va ${ex.name}?`} onClose={props.onClose} large>
      <ChoiceList
        name="anadir-a"
        legend="Sesión"
        options={sesiones.value.map((s) => ({
          value: s.sigla,
          label: titulos[s.sigla],
          detail: loLleva(s.sigla) ? 'ya lo tiene' : undefined,
        }))}
        value=""
        onChange={(sigla) => {
          if (loLleva(sigla)) return props.onHecho(titulos[sigla])
          const nombres = sesiones.value.find((s) => s.sigla === sigla)?.ejercicios.map((e) => e.nombre) ?? []
          const nuevo = { nombre: ex.name, series: 3, reps: ex.reps, rir: ex.rir, descanso: ex.restSec }
          void editarSesion(sigla, (ed) => anadir(ed, nuevo, nombres))
          props.onHecho(titulos[sigla], () => void editarSesion(sigla, (ed) => quitar(ed, ex.name)))
        }}
      />
    </Sheet>
  )
}
