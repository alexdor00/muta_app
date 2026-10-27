import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'

export function SesionInicioScreen(props: { sessionId: string }) {
  return (
    <Pending code="C00" title={`Sesión ${props.sessionId}`}>
      <a href={paths.routine}>‹ Tu rutina</a> · <a href={paths.session(props.sessionId)}>Empezar sesión</a>
    </Pending>
  )
}
