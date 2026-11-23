import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { LetraMenu } from '../../components/LetraMenu.tsx'
import { COMIDAS, type ComidaId } from '../../state/comida.ts'
import { menu, platoPorId, totalDePlato, type Plato } from '../../state/recetas.ts'
import { anadirExtra, ponerPlato, volverA } from '../../use-cases/menu.ts'
import a from '../comida/Anadir.module.css'
import p from '../comida/PlanHojas.module.css'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import s from './Apuntar.module.css'

type Props = {
  plato: Plato
  /** La comida que toca (por la hora o de donde vienes). */
  comida: ComidaId
  /** Sus kcal tal como está (con tus gramos y raciones), para decir cuánto suma. */
  kcal: number
  /** «hoy» o «el sáb 21 nov». */
  cuando: string
  /** Apuntarla en tu día, en esa comida. */
  apuntarHoy: (comida: ComidaId) => Promise<void>
  /** Ajustar sus gramos a lo que te falta hoy (sale en «Hoy»); null si la receta no se ajusta. */
  onAjustar: (() => void) | null
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

/**
 * Apuntar una receta (usuario, 2026-11-21: la receta es para verla; un solo botón): «Hoy», en una comida de tu día, o
 * «En un menú» (las letras en su color, como en Plan) y su comida. Si esa comida ya lleva un plato, eliges: en su lugar o
 * además (va como «algo más», una ración). Con «Deshacer».
 */
export function ApuntarHoja({
  plato,
  comida: inicial,
  kcal,
  cuando,
  apuntarHoy,
  onAjustar,
  onClose,
  avisar,
}: Props) {
  const menus = menu.value.menus
  const [donde, setDonde] = useState<'hoy' | 'menu'>('hoy')
  const [menuId, setMenuId] = useState(menus[0]?.id ?? '')
  const [comida, setComida] = useState<ComidaId>(inicial)
  const [modo, setModo] = useState<'cambiar' | 'ademas'>('cambiar')
  const m = menus.find((x) => x.id === menuId)
  const ocupado = m?.platos[comida]
  const otro = ocupado && ocupado !== plato.id ? (platoPorId(ocupado)?.nombre ?? 'otro plato') : null
  const al = COMIDAS.find((c) => c.id === comida)?.al ?? comida
  const enMenu = donde === 'menu' && m

  async function hecho() {
    if (!enMenu) {
      await apuntarHoy(comida)
      return onClose()
    }
    const t = totalDePlato(plato)
    const antes =
      otro && modo === 'ademas'
        ? await anadirExtra(m.id, comida, {
            alimentoId: null,
            platoId: plato.id,
            nombre: plato.nombre,
            categoria: plato.categoria,
            gramos: 0,
            kcal: Math.round(t.kcal),
            protein: t.protein,
            carbs: t.carbs,
            fat: t.fat,
          })
        : await ponerPlato(m.id, comida, plato.id).then(() => null)
    onClose()
    avisar(`En el ${m.nombre}`, {
      label: 'Deshacer',
      onClick: () => void (antes ? volverA(antes) : ponerPlato(m.id, comida, ocupado ?? null)),
    })
  }

  return (
    <Sheet
      title={`Apuntar ${plato.nombre.toLowerCase()}`}
      onClose={onClose}
      footer={
        <div class={h.actions}>
          <Button onClick={() => void hecho()}>{enMenu ? `Poner en el ${m.nombre}` : `Añadir ${al}`}</Button>
        </div>
      }
    >
      <div class={s.hoja}>
        {menus.length > 0 && (
          <ChoiceSegmented
            name="donde"
            legend="Dónde la apuntas"
            options={[
              { value: 'hoy', label: cuando === 'hoy' ? 'Hoy' : cuando.replace(/^el /, '') },
              { value: 'menu', label: 'En un menú' },
            ]}
            value={donde}
            onChange={setDonde}
          />
        )}
        {enMenu && menus.length > 1 && (
          <section>
            <h3 class={s.rotulo}>Menú</h3>
            <div class={s.letras} role="group" aria-label="Menú">
              {menus.map((x, i) => (
                <button
                  key={x.id}
                  type="button"
                  class={s.letra}
                  aria-pressed={x.id === menuId}
                  aria-label={x.nombre}
                  onClick={() => setMenuId(x.id)}
                >
                  <LetraMenu id={x.id} indice={i} tam="grande" elegida={x.id === menuId} />
                </button>
              ))}
            </div>
          </section>
        )}
        {/* La comida y lo que ya lleva, en desplegables (usuario, 2026-11-21) */}
        <ul class={p.filas}>
          <li class={p.fila}>
            <label class={p.que} for="apuntar-comida">
              En qué comida
            </label>
            <select
              id="apuntar-comida"
              class={p.valor}
              value={comida}
              onChange={(e) => setComida(e.currentTarget.value as ComidaId)}
            >
              {COMIDAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </li>
        </ul>
        {enMenu && otro && (
          <section>
            <h3 class={s.rotulo}>Ya lleva {otro.toLowerCase()}</h3>
            <div class={a.pastillas} role="group" aria-label="Cambiar o añadir">
              {(
                [
                  ['cambiar', 'Cambiar'],
                  ['ademas', 'Añadir'],
                ] as const
              ).map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  class={`${a.pastilla} ${modo === v ? a.on : ''}`}
                  aria-pressed={modo === v}
                  onClick={() => setModo(v)}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        )}
        <p class={s.nota}>
          {enMenu
            ? otro && modo === 'ademas'
              ? `Una ración más en esa comida, todos los días con el ${m.nombre}.`
              : `Se ajusta a lo que te toca en el ${m.nombre}.`
            : `${formatInt(kcal)} kcal ${cuando}.`}
        </p>
        {!enMenu && onAjustar && (
          <button type="button" class={h.textButton} onClick={onAjustar}>
            Ajustar a lo que te falta
          </button>
        )}
      </div>
    </Sheet>
  )
}
