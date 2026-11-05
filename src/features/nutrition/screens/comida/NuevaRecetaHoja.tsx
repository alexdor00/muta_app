import { useLocation } from 'preact-iso'
import { useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { COMIDAS, type ComidaId } from '../../state/comida.ts'
import { crearReceta } from '../../use-cases/diet.ts'
import h from '../comun/Hojas.module.css'

type Props = { menu: string | null; onClose: () => void }

/** Una receta tuya nueva: nombre y comida; después se le ponen los ingredientes en la receta. */
export function NuevaRecetaHoja({ menu, onClose }: Props) {
  const { route } = useLocation()
  const [nombre, setNombre] = useState('')
  const [comida, setComida] = useState<ComidaId>('comida')
  return (
    <Sheet
      title="Receta nueva"
      onClose={onClose}
      large
      footer={
        <Button
          onClick={async () => {
            const id = await crearReceta(nombre, comida, menu)
            route(`${paths.recipe(id)}?editar=1`, true)
          }}
        >
          Crear y poner ingredientes
        </Button>
      }
    >
      <div class={h.stack}>
        <label class={h.field}>
          Nombre
          <input
            value={nombre}
            placeholder="Tortilla de patata"
            onInput={(e) => setNombre(e.currentTarget.value)}
          />
        </label>
        <ChoiceSegmented<ComidaId>
          name="comida-receta"
          legend="Se apunta en"
          showLegend
          options={COMIDAS.map((c) => ({ value: c.id, label: c.nombre }))}
          value={comida}
          onChange={setComida}
        />
        <p class={h.foot}>{menu ? `Va en el menú ${menu}.` : 'Va todos los días.'}</p>
      </div>
    </Sheet>
  )
}
