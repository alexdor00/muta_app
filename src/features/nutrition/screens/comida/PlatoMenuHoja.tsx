import { useState } from 'preact/hooks'
import { formatDayDate, formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFila } from '../../components/Platos.tsx'
import { hoy, type ComidaId } from '../../state/comida.ts'
import {
  diasDelMenu,
  fotos,
  gramosDeHueco,
  huecoDe,
  menu,
  platoPorId,
  totalCon,
  type Cocinado,
} from '../../state/recetas.ts'
import { ajustarComida, cocinadoNuevo, ponerPlato } from '../../use-cases/menu.ts'
import { CambiarHoja } from '../plato/CambiarHoja.tsx'
import { comidaDe, macrosCortos } from '../comun/platos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import r from '../receta/Receta.module.css'
import s from '../plato/Plato.module.css'

type Props = {
  menuId: string
  comida: ComidaId
  onClose: () => void
  onCambiar: () => void
  onCocinar: (c: Cocinado) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Un plato de un menú: sus cantidades (las que te sugiere para tu objetivo o las de la receta), cambiar un ingrediente por
 * otro parecido, cuándo lo cocinas, cambiar el plato o quitarlo.
 */
export function PlatoMenuHoja({ menuId, comida, onClose, onCambiar, onCocinar, avisar }: Props) {
  const [cual, setCual] = useState<number | null>(null)
  const m = menu.value.menus.find((x) => x.id === menuId)
  const id = m?.platos[comida]
  if (!m || !id) return null
  const fecha = diasDelMenu(menu.value, menuId, hoy.value)[0] ?? hoy.value
  const p = platoPorId(id, fecha)
  const hueco = huecoDe(menu.value, fecha, comida) ?? {
    fecha,
    comida,
    menu: menuId,
    plato: id,
    cocinado: null,
  }
  if (cual !== null && p)
    return <CambiarHoja plato={p} indice={cual} fecha={fecha} onClose={() => setCual(null)} avisar={avisar} />
  const ajustada = !m.fijos?.includes(comida)
  const gramos = p ? gramosDeHueco(hueco, p) : []
  const total = p ? totalCon(p, gramos) : null
  const cocinado = hueco.cocinado ? menu.value.cocinados.find((c) => c.id === hueco.cocinado) : null
  return (
    <Sheet title={`${m.nombre} · ${comidaDe(comida).nombre}`} onClose={onClose} large>
      <div class={h.stack}>
        <ul class={h.list}>
          <PlatoFila
            nombre={p?.nombre ?? 'Plato que ya no está'}
            foto={fotos.value[id] ?? null}
            lineas={total ? [macrosCortos(total)] : []}
            href={p ? `${paths.dish(id, { comida })}&desde=menu` : undefined}
          />
        </ul>
        {p?.ajustable && (
          <ChoiceSegmented<'si' | 'no'>
            name="cantidades"
            legend="Cantidades"
            showLegend
            options={[
              { value: 'si', label: 'Para tu objetivo' },
              { value: 'no', label: 'Como en la receta' },
            ]}
            value={ajustada ? 'si' : 'no'}
            onChange={(v) => void ajustarComida(menuId, comida, v === 'si')}
          />
        )}
        {p && (
          <ul class={r.list}>
            {p.ingredientes.map((i, k) =>
              i.cuenta && i.gramos !== null && i.alimentoId ? (
                <li key={`${i.texto}-${k}`}>
                  <button type="button" class={r.row} onClick={() => setCual(k)}>
                    <span class={r.rowText}>
                      <span class={r.name}>{i.nombre}</span>
                      {i.antes && <span class={h.foot}>En lugar de {i.antes.toLowerCase()}</span>}
                    </span>
                    <b class={r.grams}>
                      {gramos[k] !== null && gramos[k] !== i.gramos && (
                        <span class={s.old}>{formatInt(i.gramos)}</span>
                      )}
                      {formatInt(gramos[k] ?? i.gramos)} g
                    </b>
                    <ChevronRightIcon />
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        )}
        <p class={h.foot}>Toca un ingrediente para cambiarlo por otra marca u otro parecido.</p>
        <div class={h.actions}>
          {p && (
            <Button
              variant="secondary"
              onClick={() => onCocinar(cocinado ?? cocinadoNuevo(fecha, comida, id))}
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
