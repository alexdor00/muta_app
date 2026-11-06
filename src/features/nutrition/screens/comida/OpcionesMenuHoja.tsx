import { useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { MAX_MENUS, menu } from '../../state/recetas.ts'
import { duplicarMenu, quitarMenu, renombrarMenu, volverA } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  menuId: string
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/** Un menú: su nombre, duplicarlo o quitarlo (con «Deshacer»). */
export function OpcionesMenuHoja({ menuId, onClose, avisar }: Props) {
  const m = menu.value.menus.find((x) => x.id === menuId)
  const [nombre, setNombre] = useState(m?.nombre ?? '')
  if (!m) return null
  const guardar = () =>
    nombre.trim() && nombre !== m.nombre ? renombrarMenu(menuId, nombre) : Promise.resolve()
  return (
    <Sheet
      title={m.nombre}
      onClose={() => void guardar().then(onClose)}
      footer={
        <div class={h.actions}>
          <Button onClick={() => void guardar().then(onClose)}>Listo</Button>
        </div>
      }
    >
      <div class={h.stack}>
        <label class={h.field}>
          <span class={h.foot}>Nombre</span>
          <input
            type="text"
            value={nombre}
            maxLength={30}
            onInput={(e) => setNombre(e.currentTarget.value)}
          />
        </label>
        <Button
          variant="secondary"
          disabled={menu.value.menus.length >= MAX_MENUS}
          onClick={async () => {
            await guardar()
            if (await duplicarMenu(menuId)) {
              onClose()
              avisar(`Copiado: ${menu.value.menus.at(-1)?.nombre}`)
            }
          }}
        >
          Duplicar
        </Button>
        {menu.value.menus.length > 1 && (
          <button
            type="button"
            class={`${h.textButton} ${h.danger}`}
            onClick={async () => {
              const antes = await quitarMenu(menuId)
              onClose()
              avisar(`Quitado ${m.nombre}`, { label: 'Deshacer', onClick: () => void volverA(antes) })
            }}
          >
            Quitar este menú
          </button>
        )}
      </div>
    </Sheet>
  )
}
