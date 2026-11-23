import { useState } from 'preact/hooks'
import { PencilIcon, TrashIcon } from '../../../../shared/ui/icons.tsx'
import { CopyIcon } from '../../../../shared/ui/iconosHoy.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { LetraMenu } from '../../components/LetraMenu.tsx'
import { hoy } from '../../state/comida.ts'
import { cicloDe, MAX_MENUS, menu } from '../../state/recetas.ts'
import { duplicarMenu, quitarMenu, renombrarMenu, volverA } from '../../use-cases/menu.ts'
import type { Aviso } from '../comun/useAviso.ts'
import styles from './OpcionesMenu.module.css'

type Props = {
  menuId: string
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Un menú (usuario, 2026-11-19, `Desktop/MUTA-Opciones-menu.png`): su letra y su nombre, que se cambia tocándolo, y dos
 * botones iguales: Duplicar y Quitar (con «Deshacer»).
 */
export function OpcionesMenuHoja({ menuId, onClose, avisar }: Props) {
  const m = menu.value.menus.find((x) => x.id === menuId)
  const [nombre, setNombre] = useState(m?.nombre ?? '')
  if (!m) return null
  const guardar = () =>
    nombre.trim() && nombre !== m.nombre ? renombrarMenu(menuId, nombre) : Promise.resolve()
  const ciclo = cicloDe(menu.value, hoy.value).menus
  const va = ciclo.filter((id) => id === menuId).length
  const cerrar = () => void guardar().then(onClose)
  return (
    <Sheet title="Tu menú" onClose={cerrar}>
      <div class={styles.cabeza}>
        <LetraMenu id={m.id} indice={menu.value.menus.indexOf(m)} tam="grande" />
        <div class={styles.texto}>
          <label class={styles.nombre}>
            <input
              type="text"
              value={nombre}
              maxLength={30}
              size={Math.max(4, nombre.length)}
              aria-label="Nombre del menú"
              onInput={(e) => setNombre(e.currentTarget.value)}
              onBlur={() => void guardar()}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
            <PencilIcon />
          </label>
          <small>
            Va {va} {va === 1 ? 'día' : 'días'} de {ciclo.length}
          </small>
        </div>
      </div>
      <div class={styles.botones}>
        <button
          type="button"
          disabled={menu.value.menus.length >= MAX_MENUS}
          onClick={async () => {
            await guardar()
            if (await duplicarMenu(menuId)) {
              onClose()
              avisar(`Copiado: ${menu.value.menus.at(-1)?.nombre}`)
            }
          }}
        >
          <CopyIcon />
          Duplicar
        </button>
        <button
          type="button"
          class={styles.quitar}
          disabled={menu.value.menus.length <= 1}
          onClick={async () => {
            if (!window.confirm(`¿Quitar ${m.nombre}? Sus días pasan a otro menú.`)) return
            const antes = await quitarMenu(menuId)
            onClose()
            avisar(`Quitado ${m.nombre}`, { label: 'Deshacer', onClick: () => void volverA(antes) })
          }}
        >
          <TrashIcon />
          Quitar
        </button>
      </div>
    </Sheet>
  )
}
