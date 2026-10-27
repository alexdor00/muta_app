import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'

export function TuRutinaScreen() {
  return (
    <Pending code="A06" title="Tu rutina">
      <a href={paths.training}>‹ Tu plan</a> · <a href={paths.sessionStart('a1')}>Sesión A1</a>
    </Pending>
  )
}
