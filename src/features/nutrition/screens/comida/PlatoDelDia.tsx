import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { CheckIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import type { ComidaId } from '../../state/comida.ts'
import { enCrudo, gramosDeHueco, huecoDe, menu, platoPorId, totalCon } from '../../state/recetas.ts'
import { apuntarPlato, desapuntar, platoApuntado } from '../../use-cases/recipes.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import r from '../receta/Receta.module.css'

type Props = {
  comida: ComidaId
  fecha: string
  onCambiar: (k: number) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * El plato de tu menú en una comida de un día, con sus gramos de ese día: apuntarlo de un toque y, tocando un ingrediente,
 * cambiarlo (por otra marca u otro alimento) solo ese día o para siempre en el plato.
 */
export function PlatoDelDia(props: Props) {
  const hueco = huecoDe(menu.value, props.fecha, props.comida)
  const p = hueco ? platoPorId(hueco.plato, props.fecha) : null
  if (!hueco || !p) return null
  const gramos = gramosDeHueco(hueco, p)
  const hecho = platoApuntado(p.id, props.comida, props.fecha)
  const kcal = totalCon(p, gramos).kcal
  return (
    <section class={h.stack} aria-labelledby="plato-del-dia">
      <h3 id="plato-del-dia" class={h.eyebrow}>
        De tu menú · {p.nombre}
      </h3>
      {hecho ? (
        <p class={h.hecho}>
          <CheckIcon /> Apuntado
        </p>
      ) : (
        <Button
          variant="secondary"
          onClick={async () => {
            const ids = await apuntarPlato(p, props.comida, gramos, 1, props.fecha)
            props.avisar(`${p.nombre}: apuntado`, {
              label: 'Deshacer',
              onClick: () => void desapuntar(ids, props.fecha),
            })
          }}
        >
          Apuntar este plato · {formatInt(kcal)} kcal
        </Button>
      )}
      <ul class={r.list}>
        {p.ingredientes.map((i, k) => {
          const g = gramos[k] ?? i.gramos
          if (!i.cuenta || g === null || !i.alimentoId) return null
          const crudo = enCrudo(i.alimentoId, g)
          return (
            <li key={`${i.texto}-${k}`}>
              <button type="button" class={r.row} onClick={() => props.onCambiar(k)}>
                <span class={r.rowText}>
                  <span class={r.name}>{i.nombre}</span>
                  {i.antes && <span class={h.foot}>En lugar de {i.antes.toLowerCase()}</span>}
                  {crudo && <span class={h.foot}>{crudo}</span>}
                </span>
                <b class={r.grams}>{formatInt(g)} g</b>
                <ChevronRightIcon />
              </button>
            </li>
          )
        })}
      </ul>
      <p class={h.foot}>¿Hoy usaste otra cosa? Toca un ingrediente y cámbialo solo para este día.</p>
    </section>
  )
}
