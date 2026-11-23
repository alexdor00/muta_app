import { paths } from '../../../shared/lib/paths.ts'
import { BookIcon, PencilIcon, SwapIcon } from '../../../shared/ui/icons.tsx'
import { MenuList } from '../../../shared/ui/MenuList.tsx'
import { Sheet } from '../../../shared/ui/Sheet.tsx'

type Accion = 'biblioteca' | 'editar'

/**
 * Hoja «Tu rutina» (el «···» de Tu plan): editar la rutina, cambiarla y la biblioteca. La foto de cada sesión y volver a la
 * rutina original van dentro de Editar rutina; la cobertura, en los consejos del entrenador.
 */
export function TuRutinaSheet({
  onClose,
  acciones,
}: {
  onClose: () => void
  acciones: Record<Accion, () => void>
}) {
  return (
    <Sheet title="Tu rutina" onClose={onClose} large>
      <MenuList
        rows={[
          { label: 'Editar rutina', Icon: PencilIcon, onClick: acciones.editar },
          { label: 'Cambiar de rutina', Icon: SwapIcon, href: paths.chooseRoutine },
          { label: 'Biblioteca de ejercicios', Icon: BookIcon, onClick: acciones.biblioteca },
        ]}
      />
    </Sheet>
  )
}
