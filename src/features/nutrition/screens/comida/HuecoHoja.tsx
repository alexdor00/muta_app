import { formatDayDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFila } from '../../components/Platos.tsx'
import { hoy, type ComidaId } from '../../state/comida.ts'
import { fotos, huecoDe, menu, platoPorId, totalDelHueco, type Cocinado } from '../../state/recetas.ts'
import { cocinadoNuevo, ponerHueco, quitarPlato } from '../../use-cases/menu.ts'
import { apuntarPlato, desapuntar, platoApuntado } from '../../use-cases/recipes.ts'
import { comidaDe, macrosCortos } from '../comun/platos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  fecha: string
  comida: ComidaId
  onClose: () => void
  onCambiar: () => void
  onCocinar: (c: Cocinado) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/** Una comida de tu menú: su plato, apuntarlo, cuándo lo cocinas, cambiarlo o quitarlo. */
export function HuecoHoja({ fecha, comida, onClose, onCambiar, onCocinar, avisar }: Props) {
  const hueco = huecoDe(menu.value, fecha, comida)
  const p = hueco ? platoPorId(hueco.plato) : null
  if (!hueco) return null
  const total = totalDelHueco(hueco)
  const cocinado = hueco.cocinado ? menu.value.cocinados.find((c) => c.id === hueco.cocinado) : null
  const ya = p ? platoApuntado(p.id, comida, fecha) : false
  return (
    <Sheet title={`${comidaDe(comida).nombre} · ${formatDayDate(fecha)}`} onClose={onClose}>
      <div class={h.stack}>
        <ul class={h.list}>
          <PlatoFila
            nombre={p?.nombre ?? 'Plato que ya no está'}
            foto={fotos.value[hueco.plato] ?? null}
            lineas={[
              total ? macrosCortos(total) : '',
              hueco.gramos ? 'Ajustado a esta comida' : 'Como en la receta',
            ].filter(Boolean)}
            href={p ? `${paths.dish(p.id, { comida, fecha })}&desde=menu` : undefined}
          />
        </ul>
        <p class={h.foot}>
          {cocinado
            ? `Se cocina el ${formatDayDate(cocinado.fecha)} a las ${cocinado.hora}, para ${cocinado.para.length} ${cocinado.para.length === 1 ? 'comida' : 'comidas'}.`
            : 'Se cocina ese mismo día.'}
        </p>
        <div class={h.actions}>
          {p && fecha <= hoy.value && (
            <Button
              variant={ya ? 'secondary' : 'primary'}
              disabled={ya}
              onClick={async () => {
                const ids = await apuntarPlato(p, comida, hueco.gramos, 1, fecha)
                onClose()
                avisar('Apuntado', { label: 'Deshacer', onClick: () => void desapuntar(ids, fecha) })
              }}
            >
              {ya ? 'Ya está apuntado' : 'Apuntar'}
            </Button>
          )}
          {p && (
            <Button
              variant="secondary"
              onClick={() => onCocinar(cocinado ?? cocinadoNuevo(fecha, comida, p.id))}
            >
              {cocinado ? 'Cambiar cuándo lo cocinas' : 'Cuándo cocinarlo'}
            </Button>
          )}
          <Button variant="secondary" onClick={onCambiar}>
            Cambiar de plato
          </Button>
          <button
            type="button"
            class={h.textButton}
            onClick={async () => {
              const antes = await quitarPlato(fecha, comida)
              onClose()
              if (antes)
                avisar('Quitado del menú', { label: 'Deshacer', onClick: () => void ponerHueco(antes) })
            }}
          >
            Quitar del menú
          </button>
        </div>
      </div>
    </Sheet>
  )
}
