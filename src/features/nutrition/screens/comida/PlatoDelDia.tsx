import { formatInt } from '../../../../shared/lib/format.ts'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import type { ComidaId } from '../../state/comida.ts'
import { enCrudo, gramosDeHueco, huecoDe, menu, platoPorId } from '../../state/recetas.ts'
import h from '../comun/Hojas.module.css'
import r from '../receta/Receta.module.css'

/**
 * El plato de tu menú en una comida de un día, con sus gramos de ese día. Tocar un ingrediente lo cambia (por otra marca
 * u otro alimento) solo ese día o para siempre en el plato.
 */
export function PlatoDelDia(props: { comida: ComidaId; fecha: string; onCambiar: (k: number) => void }) {
  const hueco = huecoDe(menu.value, props.fecha, props.comida)
  const p = hueco ? platoPorId(hueco.plato, props.fecha) : null
  if (!hueco || !p) return null
  const gramos = gramosDeHueco(hueco, p)
  return (
    <section class={h.stack} aria-labelledby="plato-del-dia">
      <h3 id="plato-del-dia" class={h.eyebrow}>
        De tu menú · {p.nombre}
      </h3>
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
