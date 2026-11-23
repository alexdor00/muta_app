import { useEffect, useState } from 'preact/hooks'
import { addDays, formatDayDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceCircles, ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { CheckIcon, MinusIcon, PlusIcon, TrashIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { dieta, estado, hoy } from '../../state/comida.ts'
import { SECCIONES } from '../../state/dieta.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { enCrudo, estadoRecetas, menu, tienePlatos } from '../../state/recetas.ts'
import {
  anadirPropio,
  cantidad,
  compartirCompra,
  compraActual,
  DIAS_COMPRA,
  desdeElDia,
  desmarcarTodo,
  marcar,
  modoActual,
  modoDeCompra,
  vecesDeMenu,
  vecesEnLaCompra,
  paraDias,
  productosDe,
  quitarPropio,
  racionesDeMas,
} from '../../use-cases/shopping.ts'
import { Barra } from '../comun/Barra.tsx'
import { CompraSemana } from './CompraSemana.tsx'
import seg from '../comida/Anadir.module.css'
import cs from './Compra.module.css'
import { piloto } from '../../state/autopilot.ts'
import p from '../comun/Pagina.module.css'
import h from '../comun/Hojas.module.css'
import { useAviso } from '../comun/useAviso.ts'

/**
 * La compra: sale de tu menú (los días con platos) y de tu dieta (los demás) en los días que elijas, por secciones; tus
 * productos salen con su nombre.
 */
export function CompraScreen() {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  const anadir = useSheet('anadir')
  const alguien = useSheet('alguien')
  const { aviso, avisar } = useAviso()
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  // Sin pantalla detrás (enlace directo), a tu día; si no, «‹» vuelve a la de antes
  const volver = paths.nutrition
  if (!dieta.value && !menu.value.menus.some(tienePlatos)) {
    return (
      <div class={p.page}>
        <Barra titulo="La compra" volver={volver} />
        <p class={p.sub}>La lista sale de tu menú o de tu dieta: pon platos en Nutrición · Tu plan.</p>
      </div>
    )
  }
  const c = compraActual()
  const modo = modoActual(c)
  const segmento = (
    <ChoiceSegmented<'semana' | 'dias' | 'menus'>
      name="modo-compra"
      legend="La lista sale de"
      options={[
        ...(piloto.value?.compra ? [{ value: 'semana' as const, label: 'Tu semana' }] : []),
        { value: 'dias', label: 'Unos días' },
        { value: 'menus', label: 'Unos menús' },
      ]}
      value={modo}
      onChange={(m) => void modoDeCompra(m)}
    />
  )
  if (modo === 'semana' || piloto.value?.compra)
    return (
      <div class={p.page}>
        <Barra titulo="La compra" volver={volver} />
        <CompraSemana onAnadir={anadir.show} avisar={avisar} />
        {anadir.open && <AnadirCompraHoja onClose={anadir.close} />}
        <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
      </div>
    )
  const { productos, entreno, descanso } = productosDe(c)
  const tienes = new Set(c.tienes)
  const total = productos.length + c.propios.length
  const hechos =
    productos.filter((x) => tienes.has(x.clave)).length + c.propios.filter((x) => tienes.has(x.id)).length
  const manana = addDays(hoy.value, 1)
  const porMenus = modo === 'menus'

  return (
    <div class={p.page}>
      <Barra titulo="La compra" volver={volver} />
      <section class={p.card} aria-label="Para cuándo">
        <p class={p.figure}>
          <b class={p.count}>{total - hechos}</b>
          <span class={p.sub}>
            {total - hechos === 1 ? 'cosa' : 'cosas'} por comprar · <b>{hechos}</b> de {total} ya las tienes
          </span>
        </p>
        {total > 0 && (
          <div
            class={h.track}
            role="progressbar"
            aria-label="Lo que ya tienes"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={hechos}
          >
            <i style={{ width: `${Math.round((hechos / total) * 100)}%` }} />
          </div>
        )}
        {segmento}
        {porMenus ? (
          <ul class={p.list}>
            {menu.value.menus.map((m) => (
              <li key={m.id} class={p.row}>
                <span class={p.rowText}>
                  <span class={p.rowTitle}>{m.nombre}</span>
                </span>
                <span class={h.miniStepper}>
                  <button
                    type="button"
                    aria-label={`${m.nombre}: una vez menos`}
                    disabled={!vecesEnLaCompra(c.menus, m.id)}
                    onClick={() => void vecesDeMenu(m.id, -1)}
                  >
                    <MinusIcon />
                  </button>
                  <b>× {vecesEnLaCompra(c.menus, m.id)}</b>
                  <button
                    type="button"
                    aria-label={`${m.nombre}: una vez más`}
                    onClick={() => void vecesDeMenu(m.id, 1)}
                  >
                    <PlusIcon />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p class={p.foot}>
              {formatDayDate(c.desde)} – {formatDayDate(addDays(c.desde, c.dias - 1))}
              {dieta.value ? `: ${entreno} de entreno y ${descanso} de descanso, según tu semana.` : '.'}
            </p>
            <ChoiceCircles
              name="dias-compra"
              legend="Para cuántos días"
              showLegend
              options={DIAS_COMPRA.map((n) => ({ value: n, label: String(n) }))}
              value={c.dias}
              onChange={(n) => void paraDias(n)}
            />
            <ChoiceSegmented<string>
              name="desde-compra"
              legend="Desde"
              options={[
                { value: hoy.value, label: 'Desde hoy' },
                { value: manana, label: 'Desde mañana' },
              ]}
              value={c.desde === manana ? manana : hoy.value}
              onChange={(d) => void desdeElDia(d)}
            />
          </>
        )}
        <button type="button" class={p.textButton} onClick={alguien.show}>
          <PlusIcon /> ¿Come alguien más?
        </button>
        <button type="button" class={p.textButton} onClick={anadir.show}>
          <PlusIcon /> Añadir algo que no está en el menú
        </button>
      </section>

      {/* Cada sección en una tarjeta, abierta, con su círculo para marcar (rediseño 23; usuario, 2026-11-17) */}
      {SECCIONES.map((sec) => {
        const de = productos.filter((x) => x.seccion === sec.id)
        const suyos = c.propios.filter((x) => x.seccion === sec.id)
        if (!de.length && !suyos.length) return null
        return (
          <section key={sec.id} class={cs.seccion} aria-labelledby={`sec-${sec.id}`}>
            <h2 id={`sec-${sec.id}`} class={seg.rotulo}>
              {sec.nombre}
            </h2>
            <ul class={seg.tarjeta}>
              {de.map((x) => (
                <li key={x.clave}>
                  <button
                    type="button"
                    class={`${cs.item} ${tienes.has(x.clave) ? cs.marcado : ''}`}
                    aria-pressed={tienes.has(x.clave)}
                    onClick={() => void marcar(x.clave)}
                  >
                    <span class={cs.circulo} aria-hidden="true">
                      {tienes.has(x.clave) && <CheckIcon />}
                    </span>
                    <span class={cs.itemTexto}>
                      <span class={cs.itemNombre}>{x.nombre}</span>
                      {(x.menus.length > 0 || enCrudo(x.clave, x.gramos)) && (
                        <span class={cs.detalle}>
                          {[x.menus.join(' · '), enCrudo(x.clave, x.gramos)].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                    <span class={cs.cantidad}>{x.gramos ? cantidad(x.gramos) : 'al gusto'}</span>
                  </button>
                </li>
              ))}
              {suyos.map((x) => (
                <li key={x.id} class={p.withAction}>
                  <button
                    type="button"
                    class={`${cs.item} ${tienes.has(x.id) ? cs.marcado : ''}`}
                    aria-pressed={tienes.has(x.id)}
                    onClick={() => void marcar(x.id)}
                  >
                    <span class={cs.circulo} aria-hidden="true">
                      {tienes.has(x.id) && <CheckIcon />}
                    </span>
                    <span class={cs.itemTexto}>
                      <span class={cs.itemNombre}>{x.nombre}</span>
                      <span class={cs.detalle}>Añadido por ti</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    class={h.round}
                    aria-label={`Quitar ${x.nombre}`}
                    onClick={() => void quitarPropio(x.id)}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <div class={p.row2}>
        <Button variant="secondary" onClick={anadir.show}>
          + Añadir
        </Button>
        <Button variant="secondary" onClick={() => void desmarcarTodo()}>
          Desmarcar
        </Button>
      </div>
      <Button
        onClick={async () => {
          const r = await compartirCompra()
          if (r === 'saved') avisar('Excel guardado en Descargas: compártelo desde ahí')
          if (r === 'copied') avisar('Lista copiada: pégala en Notas o WhatsApp')
        }}
      >
        Compartir la lista
      </Button>
      <p class={p.foot}>
        Sale de tus menús con los gramos de cada día{dieta.value ? ' y de tu dieta los días sin menú' : ''}.
        Lo que va «al gusto» sale sin cantidad.
      </p>

      {anadir.open && <AnadirCompraHoja onClose={anadir.close} />}
      {alguien.open && <AlguienMasHoja onClose={alguien.close} />}
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}

function AnadirCompraHoja({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState('')
  const [seccion, setSeccion] = useState('despensa')
  return (
    <Sheet
      title="Añadir a la lista"
      onClose={onClose}
      large
      footer={
        <Button
          disabled={!nombre.trim()}
          onClick={async () => {
            await anadirPropio(nombre, seccion)
            onClose()
          }}
        >
          Añadir
        </Button>
      }
    >
      <div class={h.stack}>
        <label class={h.field}>
          Qué
          <input
            value={nombre}
            placeholder="Café, papel de cocina…"
            onInput={(e) => setNombre(e.currentTarget.value)}
          />
        </label>
        <div class={h.chips} role="group" aria-label="Sección">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              class={`${h.chip} ${seccion === s.id ? h.chipOn : ''}`}
              aria-pressed={seccion === s.id}
              onClick={() => setSeccion(s.id)}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

function AlguienMasHoja({ onClose }: { onClose: () => void }) {
  const c = compraActual()
  const recetas = dieta.value?.dieta.recetas ?? []
  return (
    <Sheet title="¿Come alguien más?" onClose={onClose} large>
      <div class={h.stack}>
        <p class={h.sub}>
          Súmale raciones a un plato y la lista las cuenta (para repartir la olla, mira Cocina).
        </p>
        <ul class={h.list}>
          {recetas.map((r) => (
            <li key={r.id} class={h.row}>
              <span class={h.rowMain}>
                <span class={h.rowTitle}>{r.nombre}</span>
                <span class={h.rowDetail}>{r.rotulo}</span>
              </span>
              <span class={h.miniStepper}>
                <button
                  type="button"
                  aria-label={`Una ración menos de ${r.nombre}`}
                  onClick={() => void racionesDeMas(r.id, -1)}
                >
                  <MinusIcon />
                </button>
                <b>+{c.extra[r.id] ?? 0}</b>
                <button
                  type="button"
                  aria-label={`Una ración más de ${r.nombre}`}
                  onClick={() => void racionesDeMas(r.id, 1)}
                >
                  <PlusIcon />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
