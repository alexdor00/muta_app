import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'

export function BienvenidaScreen() {
  return (
    <Pending code="A01–A04" title="Bienvenida">
      <a href={paths.training}>Empezar</a>
    </Pending>
  )
}
