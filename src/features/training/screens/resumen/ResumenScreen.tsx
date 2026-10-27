import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'

export function ResumenScreen() {
  return (
    <Pending code="C24" title="¡Sesión completada!">
      <a href={paths.training}>Volver al plan</a>
    </Pending>
  )
}
