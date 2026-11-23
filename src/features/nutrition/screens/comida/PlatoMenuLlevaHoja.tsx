import { useState } from 'preact/hooks'
import { addDays } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { hoy, type ComidaId } from '../../state/comida.ts'
import { huecoDe, menu, menuDelDia, nombreDeComida, platoPorId } from '../../state/recetas.ts'
import { CambiarHoja } from '../plato/CambiarHoja.tsx'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import { PlatoDelDia } from './PlatoDelDia.tsx'

type Props = {
  menuId: string
  comida: ComidaId
  /** Un día concreto (Mi plan); sin él, el próximo día con ese menú. */
  dia?: string
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * El plato de una comida de un menú (usuario, 2026-11-21: tocar el plato en Tus menús abre lo que lleva, como en tu día):
 * sus ingredientes con los gramos de tu menú (los del próximo día con ese menú); tocar uno lo cambia en la receta, y
 * «Ver la receta ›» para los pasos.
 */
export function PlatoMenuLlevaHoja({ menuId, comida, dia, onClose, avisar }: Props) {
  const [cual, setCual] = useState<number | null>(null)
  const m = menu.value
  const x = m.menus.find((y) => y.id === menuId)
  // El próximo día con este menú: sus gramos son los que te tocan
  const fecha =
    dia ??
    Array.from({ length: 28 }, (_, k) => addDays(hoy.value, k)).find(
      (f) => menuDelDia(m, f)?.id === menuId,
    ) ??
    null
  const hueco = fecha ? huecoDe(m, fecha, comida) : null
  const plato = hueco && fecha ? platoPorId(hueco.plato, fecha) : null
  if (!x || !fecha || !plato) return null
  if (cual !== null)
    return (
      <CambiarHoja plato={plato} indice={cual} fecha={fecha} onClose={() => setCual(null)} avisar={avisar} />
    )
  return (
    <Sheet title={plato.nombre} onClose={onClose} large>
      <div class={h.stack}>
        <PlatoDelDia
          comida={comida}
          fecha={fecha}
          onCambiar={setCual}
          avisar={avisar}
          enMenu={`${x.nombre} · ${nombreDeComida(m, comida).toLowerCase()}`}
        />
        <Button variant="secondary" href={paths.dish(plato.id, { comida })}>
          Ver la receta
        </Button>
      </div>
    </Sheet>
  )
}
