import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'

export function HoyScreen() {
  return (
    <Pending code="Hoy" title="Hoy">
      <a href={paths.sessionStart('a1')}>Comenzar entrenamiento</a>
    </Pending>
  )
}
