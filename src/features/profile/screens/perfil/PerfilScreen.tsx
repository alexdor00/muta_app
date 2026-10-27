import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'

export function PerfilScreen() {
  return (
    <Pending code="Propuesta" title="Perfil">
      <a href={paths.training}>‹ Tu plan</a>
    </Pending>
  )
}
