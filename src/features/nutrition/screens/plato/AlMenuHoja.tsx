import { useState } from 'preact/hooks'
import { formatDayDate } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceChips, ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { COMIDAS, hoy, type ComidaId } from '../../state/comida.ts'
import { huecoDe, menu, platoPorId, semanaDesde, vaCon, type Plato } from '../../state/recetas.ts'
import { ponerPlato, ponerHueco, quitarPlato } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { plato: Plato; onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/** Pone el plato en una comida de tu menú (de hoy a 7 días), ya ajustado a lo que le toca a esa comida. */
export function AlMenuHoja({ plato, onClose, avisar }: Props) {
  const dias = semanaDesde(hoy.value)
  const [fecha, setFecha] = useState(dias[0])
  const [comida, setComida] = useState<ComidaId>(COMIDAS.find((c) => vaCon(plato, c.id))?.id ?? 'comida')
  const ocupado = huecoDe(menu.value, fecha, comida)
  return (
    <Sheet
      title={`${plato.nombre} · al menú`}
      onClose={onClose}
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              const antes = await quitarPlato(fecha, comida)
              await ponerPlato(fecha, comida, plato.id)
              onClose()
              avisar(`En tu menú: ${formatDayDate(fecha)}`, {
                label: 'Deshacer',
                onClick: () => void (antes ? ponerHueco(antes) : quitarPlato(fecha, comida)),
              })
            }}
          >
            Poner en el menú
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <ChoiceChips<string>
          name="menu-dia"
          legend="Día"
          showLegend
          options={dias.map((d, i) => ({ value: d, label: i === 0 ? 'Hoy' : formatDayDate(d) }))}
          value={fecha}
          onChange={setFecha}
        />
        <ChoiceSegmented<ComidaId>
          name="menu-comida"
          legend="Comida"
          showLegend
          options={COMIDAS.map((c) => ({ value: c.id, label: c.nombre }))}
          value={comida}
          onChange={setComida}
        />
        <p class={h.foot}>
          {ocupado ? `Cambia a «${platoPorId(ocupado.plato)?.nombre ?? 'otro plato'}». ` : ''}
          Se ajusta a lo que le toca a esa comida de tu objetivo (reparto sugerido: desayuno 25 %, comida 35
          %, merienda 15 %, cena 25 %).
        </p>
      </div>
    </Sheet>
  )
}
