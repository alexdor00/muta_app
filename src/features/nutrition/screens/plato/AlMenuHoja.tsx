import { useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { COMIDAS, type ComidaId } from '../../state/comida.ts'
import { menu, platoPorId, vaCon, type Plato } from '../../state/recetas.ts'
import { ponerPlato } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { plato: Plato; onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/** Pone el plato en una comida de uno de tus menús; sus gramos se ajustan solos a cada día. */
export function AlMenuHoja({ plato, onClose, avisar }: Props) {
  const menus = menu.value.menus
  const [menuId, setMenuId] = useState(menus[0].id)
  const [comida, setComida] = useState<ComidaId>(COMIDAS.find((c) => vaCon(plato, c.id))?.id ?? 'comida')
  const m = menus.find((x) => x.id === menuId)
  const ocupado = m?.platos[comida]
  return (
    <Sheet
      title="Al menú"
      onClose={onClose}
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              const antes = await ponerPlato(menuId, comida, plato.id)
              onClose()
              avisar(`En ${m?.nombre ?? 'tu menú'}`, {
                label: 'Deshacer',
                onClick: () => void ponerPlato(menuId, comida, antes),
              })
            }}
          >
            Poner en {m?.nombre ?? 'el menú'}
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        {menus.length > 1 && (
          <ChoiceSegmented<string>
            name="al-menu"
            legend="Menú"
            showLegend
            options={menus.map((x) => ({ value: x.id, label: x.id }))}
            value={menuId}
            onChange={setMenuId}
          />
        )}
        <ChoiceSegmented<ComidaId>
          name="al-menu-comida"
          legend="Comida"
          showLegend
          options={COMIDAS.map((c) => ({ value: c.id, label: c.nombre }))}
          value={comida}
          onChange={setComida}
        />
        {ocupado && ocupado !== plato.id && (
          <p class={h.foot}>Cambia a «{platoPorId(ocupado)?.nombre ?? 'otro plato'}».</p>
        )}
      </div>
    </Sheet>
  )
}
