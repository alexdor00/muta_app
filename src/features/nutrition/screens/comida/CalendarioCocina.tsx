import { CartIcon, PotIcon } from '../../../../shared/ui/iconosHoy.tsx'
import { DIA_LARGO, diaSemana, NOMBRE_DIA } from '../../state/recetas.ts'
import o from './Organizar.module.css'

/**
 * Tus próximos 14 días (usuario, 2026-11-17: «el calendario que se toca»): cada día con la letra de su menú, una olla si
 * cocinas y un carrito si compras. Tocar un día pone o quita la olla (lo demás lo recoloca MUTA al aplicar).
 */
export function CalendarioCocina(props: {
  dias: string[]
  hoy: string
  menuDe: (fecha: string) => string
  cocina: (fecha: string) => boolean
  compra: (fecha: string) => boolean
  onTocar: (fecha: string) => void
}) {
  return (
    <section class={`${o.tarjeta} ${o.calendario}`} aria-labelledby="org-calendario">
      <div class={o.cabeza}>
        <h3 id="org-calendario" class={o.titulo}>
          Tus próximos días
        </h3>
        <span class={o.detalle}>Toca un día para cocinar o no</span>
      </div>
      <div class={o.rejilla}>
        {props.dias.map((f) => {
          const cocina = props.cocina(f)
          const compra = props.compra(f)
          return (
            <button
              key={f}
              type="button"
              class={`${o.celda} ${cocina ? o.celdaCocina : ''}`}
              aria-pressed={cocina}
              aria-label={`${f === props.hoy ? 'Hoy' : DIA_LARGO[diaSemana(f)]} ${Number(f.slice(8))}, menú ${props.menuDe(f)}${cocina ? ', cocinas' : ''}${compra ? ', compras' : ''}`}
              onClick={() => props.onTocar(f)}
            >
              <small>{f === props.hoy ? 'Hoy' : NOMBRE_DIA[diaSemana(f)]}</small>
              <b>{Number(f.slice(8))}</b>
              <span class={o.letra}>{props.menuDe(f)}</span>
              <span class={o.iconos} aria-hidden="true">
                {cocina && <PotIcon />}
                {compra && <CartIcon />}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
