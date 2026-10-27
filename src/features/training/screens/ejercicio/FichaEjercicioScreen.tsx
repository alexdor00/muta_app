import { Pending } from '../../../../shared/ui/Pending.tsx'

export function FichaEjercicioScreen(props: { exerciseId: string }) {
  return <Pending code="Propuesta" title={`Ficha: ${props.exerciseId}`} />
}
