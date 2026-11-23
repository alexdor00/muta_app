import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Switch } from '../../../../shared/ui/Switch.tsx'
import { LetraMenu } from '../../components/LetraMenu.tsx'
import {
  cicloDe,
  DIA_LARGO,
  diaDelCicloDe,
  diaSemana,
  huecoDe,
  menu,
  menuDelDia,
  nombreDeComida,
  platoPorId,
} from '../../state/recetas.ts'
import { volverA } from '../../use-cases/menu.ts'
import { diaLibre, menuEseDia } from '../../use-cases/plan.ts'
import type { Aviso } from '../comun/useAviso.ts'
import { ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { COMIDAS, type ComidaId } from '../../state/comida.ts'
import p from './PlanHojas.module.css'

/**
 * Un día del Plan (usuario, 2026-11-18): solo ese día, otro menú o día libre (el tipo de día, en la tarjeta de hoy) (no
 * sigues el menú ni se cocina para él). Para cambiar un plato de ese día, se toca en la lista.
 */
export function UnDiaHoja(props: {
  fecha: string
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
  /** Una comida de ese día: cambiar su plato solo ese día. */
  onComida: (comida: ComidaId) => void
}) {
  const { fecha, avisar } = props
  const m = menu.value
  const actual = menuDelDia(m, fecha)
  const delCiclo = menuDelDia({ ...m, porDia: undefined }, fecha)
  const libre = !!m.libres?.includes(fecha)
  const titulo = `${DIA_LARGO[diaSemana(fecha)].replace(/^./, (c) => c.toUpperCase())} ${Number(fecha.slice(8))}`
  const ciclo = m.ciclo?.menus.length ? cicloDe(m, fecha) : null
  const deshacer = (antes: typeof m) => ({ label: 'Deshacer', onClick: () => void volverA(antes) })

  return (
    <Sheet title={titulo} onClose={props.onClose} footer={<Button onClick={props.onClose}>Listo</Button>}>
      {ciclo && <p class={p.nota}>Día {diaDelCicloDe(ciclo, fecha)} de tu dieta</p>}
      <ul class={p.filas}>
        <li class={p.fila}>
          <span class={p.que}>Menú</span>
          <span class={p.letras} role="group" aria-label="El menú de este día">
            {m.menus.map((x, i) => (
              <button
                key={x.id}
                type="button"
                aria-pressed={x.id === actual?.id}
                aria-label={x.nombre}
                onClick={async () => {
                  const antes = await menuEseDia(fecha, x.id === delCiclo?.id ? null : x.id)
                  avisar(`Este día, ${x.nombre}`, deshacer(antes))
                }}
              >
                <LetraMenu id={x.id} indice={i} tam="grande" elegida={x.id === actual?.id} />
              </button>
            ))}
          </span>
        </li>
        <li class={p.fila}>
          <span class={p.que}>
            Día libre
            <small>No sigues el menú ni se cocina para él</small>
          </span>
          <Switch
            checked={libre}
            label="Día libre"
            onChange={async (on) => {
              const antes = await diaLibre(fecha, on)
              avisar(on ? 'Día libre' : 'Vuelve el menú de este día', deshacer(antes))
            }}
          />
        </li>
      </ul>
      {!libre && (
        <ul class={p.filas} aria-label="Sus comidas">
          {COMIDAS.map((c) => {
            const h = huecoDe(m, fecha, c.id)
            const pl = h ? platoPorId(h.plato, fecha) : null
            if (!pl) return null
            return (
              <li key={c.id} class={p.fila}>
                <button type="button" class={p.item} onClick={() => props.onComida(c.id)}>
                  <span class={p.que}>
                    {pl.nombre}
                    <small>
                      {nombreDeComida(m, c.id)}
                      {m.cambiados[`${fecha}|${c.id}`] ? ' · solo este día' : ''}
                    </small>
                  </span>
                  <ChevronRightIcon />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p class={p.nota}>Solo cambia este día.</p>
    </Sheet>
  )
}
