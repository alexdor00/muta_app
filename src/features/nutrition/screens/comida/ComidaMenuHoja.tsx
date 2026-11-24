import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { PlusIcon } from '../../../../shared/ui/icons.tsx'
import { MenuDesplegable } from '../../../../shared/ui/MenuDesplegable.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { hoy, type ComidaId } from '../../state/comida.ts'
import {
  diasDeComida,
  editandoDescanso,
  platosDelMenu,
  fotos,
  horaDeComida,
  menu,
  nombreDeComida,
  opcionesDeComida,
  platoPorId,
  recetasGuardadas,
} from '../../state/recetas.ts'
import { ponerPlato, volverA } from '../../use-cases/menu.ts'
import { cambiarComida, diasDeLaComida } from '../../use-cases/plan.ts'
import type { Aviso } from '../comun/useAviso.ts'
import p from './PlanHojas.module.css'

type Props = {
  menuId: string
  comida: ComidaId
  onClose: () => void
  /** El plato de la comida: su hoja (cambiarlo, sus gramos, cómo se cocina). */
  onPlato: (menu: string, comida: ComidaId) => void
  /** Sin plato: elegir uno. */
  onElegir: (menu: string, comida: ComidaId) => void
  /** Algo más (otro plato, una fruta, un café…). */
  onExtra: (menu: string, comida: ComidaId) => void
  onQuitarExtra: (menu: string, comida: ComidaId, i: number) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
  /** Desde «Tu nutricionista»: lo que propone; arriba salen las opciones para elegir (tus guardadas primero). */
  consejo?: string
}

type Dias = 'todos' | 'entreno' | 'descanso'

/**
 * Una comida de un menú (Plan, usuario 2026-11-18): su nombre y su hora, qué días va (todos, solo entreno o solo
 * descanso) y si va igual en todos tus menús. Lo que lleva se toca en la lista (usuario, 2026-11-21); aquí, añadir si no
 * tiene plato.
 */
export function ComidaMenuHoja(props: Props) {
  const { menuId, comida: c, avisar } = props
  const m = menu.value
  const x = m.menus.find((k) => k.id === menuId)
  const [nombre, setNombre] = useState(() => nombreDeComida(m, c))
  if (!x) return null
  const id = platosDelMenu(x)[c]
  const propioDeDescanso = editandoDescanso.value && !!x.descanso?.[c]
  const plato = id ? platoPorId(id) : null
  const deshacer = (antes: typeof m) => ({ label: 'Deshacer', onClick: () => void volverA(antes) })

  return (
    <Sheet
      title={nombreDeComida(m, c)}
      onClose={props.onClose}
      footer={<Button onClick={props.onClose}>Listo</Button>}
    >
      {props.consejo !== undefined && (
        <section class={p.consejo} aria-label="Lo que propone tu nutricionista">
          <p>{props.consejo} Elige uno: primero tus guardadas.</p>
          <ul class={p.filas}>
            {opcionesDeComida(hoy.value, c, id ? [id] : []).map((o) => (
              <li key={o.plato.id} class={p.fila}>
                <PlatoFoto foto={fotos.value[o.plato.id] ?? null} />
                <span class={p.que}>
                  {o.plato.nombre}
                  <small>
                    {recetasGuardadas.value.includes(o.plato.id) ? 'Guardada · ' : ''}
                    {formatInt(o.ajuste.total.kcal)} kcal · {formatInt(o.ajuste.total.protein)} g prot.
                  </small>
                </span>
                <button
                  type="button"
                  class={p.valor}
                  onClick={async () => {
                    const antes = await ponerPlato(menuId, c, o.plato.id)
                    avisar(`${o.plato.nombre}, en tu menú`, {
                      label: 'Deshacer',
                      onClick: () => void ponerPlato(menuId, c, antes),
                    })
                  }}
                >
                  Poner
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ul class={p.filas}>
        {/* Nombre y hora en una línea (usuario, 2026-11-19) */}
        <li class={p.fila}>
          <input
            id="nombre-comida"
            aria-label="Nombre de la comida"
            class={[p.valor, p.nombreComida].join(' ')}
            type="text"
            size={Math.max(6, nombre.length)}
            value={nombre}
            onInput={(e) => setNombre(e.currentTarget.value)}
            onBlur={() => void cambiarComida(c, { nombre })}
          />
          <input
            id="hora-comida"
            aria-label="Hora"
            class={p.valor}
            type="time"
            value={horaDeComida(m, c)}
            onChange={(e) => void cambiarComida(c, { hora: e.currentTarget.value })}
          />
        </li>
        {/* Qué días va, en un desplegable (usuario, 2026-11-19: «podría ocupar una línea») */}
        <li class={p.fila}>
          <label class={p.que} for="dias-comida">
            Qué días va
          </label>
          <MenuDesplegable<Dias>
            id="dias-comida"
            etiqueta="Qué días va"
            valor={diasDeComida(m, menuId, c)}
            opciones={[
              { value: 'todos', label: 'Todos' },
              { value: 'entreno', label: 'Solo entreno' },
              { value: 'descanso', label: 'Solo descanso' },
            ]}
            onChange={async (d) => {
              const antes = await diasDeLaComida(menuId, c, d)
              avisar(d === 'todos' ? 'Va todos los días' : `Solo los días de ${d}`, deshacer(antes))
            }}
          />
        </li>
      </ul>

      {/* Lo que lleva se toca en la lista de Tus menús (usuario, 2026-11-21): aquí, solo añadir si aún no tiene plato */}
      <ul class={p.filas} aria-label="Lo que lleva">
        {/* En descanso, por defecto el de entreno; si lo cambiaste, se vuelve a él */}
        {propioDeDescanso && (
          <li class={p.fila}>
            <button
              type="button"
              class={p.item}
              onClick={async () => {
                await ponerPlato(menuId, c, null)
                avisar('Los días de descanso, el mismo plato que en entreno')
              }}
            >
              <span class={p.que}>
                Igual que en entreno
                <small>Este plato es solo de los días de descanso</small>
              </span>
            </button>
          </li>
        )}
        {/* Sin plato, las dos cosas: un plato o algo suelto (un café, un plátano…; usuario, 2026-11-19) */}
        {!plato && (
          <li class={p.fila}>
            <button type="button" class={p.item} onClick={() => props.onElegir(menuId, c)}>
              <span class={p.masItem} aria-hidden="true">
                <PlusIcon />
              </span>
              <span class={p.que}>
                Añadir un plato
                <small>Una receta del recetario o tuya</small>
              </span>
            </button>
          </li>
        )}
        {!plato && (
          <li class={p.fila}>
            <button type="button" class={p.item} onClick={() => props.onExtra(menuId, c)}>
              <span class={p.masItem} aria-hidden="true">
                <PlusIcon />
              </span>
              <span class={p.que}>
                Añadir algo más
                <small>Un café, una fruta, un yogur…</small>
              </span>
            </button>
          </li>
        )}
      </ul>
    </Sheet>
  )
}
