import { formatDayDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFila } from '../../components/Platos.tsx'
import { hoy, type ComidaId } from '../../state/comida.ts'
import {
  diasDelMenu,
  fotos,
  huecoDe,
  menu,
  platoPorId,
  totalDelHueco,
  type Cocinado,
} from '../../state/recetas.ts'
import { cocinadoNuevo, ponerPlato } from '../../use-cases/menu.ts'
import { comidaDe, macrosCortos } from '../comun/platos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  menuId: string
  comida: ComidaId
  onClose: () => void
  onCambiar: () => void
  onCocinar: (c: Cocinado) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/** Un plato de un menú: verlo, cuándo lo cocinas, cambiarlo o quitarlo. */
export function PlatoMenuHoja({ menuId, comida, onClose, onCambiar, onCocinar, avisar }: Props) {
  const m = menu.value.menus.find((x) => x.id === menuId)
  const id = m?.platos[comida]
  if (!m || !id) return null
  const primero = diasDelMenu(menu.value, menuId, hoy.value)[0] ?? null
  const hueco = primero ? huecoDe(menu.value, primero, comida) : null
  const p = platoPorId(id, primero ?? hoy.value)
  const total = hueco ? totalDelHueco(hueco) : (p?.total ?? null)
  const cocinado = hueco?.cocinado ? menu.value.cocinados.find((c) => c.id === hueco.cocinado) : null
  return (
    <Sheet title={`${m.nombre} · ${comidaDe(comida).nombre}`} onClose={onClose}>
      <div class={h.stack}>
        <ul class={h.list}>
          <PlatoFila
            nombre={p?.nombre ?? 'Plato que ya no está'}
            foto={fotos.value[id] ?? null}
            lineas={total ? [macrosCortos(total)] : []}
            href={p ? `${paths.dish(id, { comida })}&desde=menu` : undefined}
          />
        </ul>
        <div class={h.actions}>
          {p && primero && (
            <Button
              variant="secondary"
              onClick={() => onCocinar(cocinado ?? cocinadoNuevo(primero, comida, id))}
            >
              {cocinado
                ? `Lo cocinas el ${formatDayDate(cocinado.fecha)}, ${cocinado.hora}`
                : 'Cuándo cocinarlo'}
            </Button>
          )}
          <Button variant="secondary" onClick={onCambiar}>
            Cambiar de plato
          </Button>
          <button
            type="button"
            class={h.textButton}
            onClick={async () => {
              const antes = await ponerPlato(menuId, comida, null)
              onClose()
              avisar(`Quitado de ${m.nombre}`, {
                label: 'Deshacer',
                onClick: () => void ponerPlato(menuId, comida, antes),
              })
            }}
          >
            Quitar del menú
          </button>
        </div>
      </div>
    </Sheet>
  )
}
