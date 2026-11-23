import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import type { ComidaId } from '../../state/comida.ts'
import { PlatoFoto } from '../../components/Platos.tsx'
import { enCrudo, fotos, gramosDeHueco, huecoDe, menu, platoPorId, totalCon } from '../../state/recetas.ts'
import { apuntarPlato, desapuntar, platoApuntado } from '../../use-cases/recipes.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import r from '../receta/Receta.module.css'
import a from './Anadir.module.css'
import l from './PlatoDelDia.module.css'

type Props = {
  comida: ComidaId
  fecha: string
  onCambiar: (k: number) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
  /** Desde Tus menús (usuario, 2026-11-21): sin «Apuntar»; lo que cambies, en la receta. */
  enMenu?: string
  /** Con las cifras ya arriba (Tu día): sin repetir sus macros. */
  sinCifras?: boolean
  /** Ya apuntado: quitarlo de lo que llevas. */
  onQuitar?: () => void
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
  const t = totalCon(p, gramos)
  const kcal = t.kcal
  return (
    <section class={h.stack} aria-labelledby="plato-del-dia">
      {/* Su foto, de dónde es y lo que aporta (usuario, 2026-11-21) */}
      <div class={l.cabeza}>
        <PlatoFoto foto={fotos.value[p.id] ?? null} />
        <span class={l.texto}>
          <h3 id="plato-del-dia" class={h.eyebrow}>
            {props.enMenu ? `En tu ${props.enMenu}` : `Lo que llevas · ${p.nombre}`}
          </h3>
          {!props.sinCifras && (
            <span class={l.macros}>
              {formatInt(t.kcal)} kcal · {formatInt(t.protein)} g prot. · {formatInt(t.carbs)} g hidr. ·{' '}
              {formatInt(t.fat)} g grasa
            </span>
          )}
        </span>
      </div>
      {/* Ya apuntado, no se repite: sale arriba, en lo que llevas (usuario, 2026-11-17) */}
      {!hecho && !props.enMenu && (
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
      <div class={a.tarjeta}>
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
      </div>
      {props.onQuitar && (
        <Button variant="secondary" onClick={props.onQuitar}>
          Quitar de lo que llevas
        </Button>
      )}
      <p class={h.foot}>
        {props.enMenu
          ? 'Toca un ingrediente para cambiarlo en la receta.'
          : '¿Hoy usaste otra cosa? Toca un ingrediente y cámbialo solo para este día.'}
      </p>
    </section>
  )
}
