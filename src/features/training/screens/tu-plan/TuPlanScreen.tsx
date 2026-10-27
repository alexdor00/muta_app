import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'

export function TuPlanScreen() {
  return (
    <Pending code="A05" title="Tu plan">
      <a href={paths.routine}>Ver detalle</a> · <a href={paths.chooseRoutine}>Cambiar rutina</a> ·{' '}
      <a href={paths.profile}>Perfil</a>
    </Pending>
  )
}
