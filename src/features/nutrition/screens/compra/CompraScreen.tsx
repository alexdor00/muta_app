import { useEffect, useState } from 'preact/hooks'
import { addDays, formatDayDate } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceCircles, ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { CheckIcon, ChevronDownIcon, MinusIcon, PlusIcon, TrashIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { dieta, estado, hoy } from '../../state/comida.ts'
import { SECCIONES } from '../../state/dieta.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { estadoRecetas, menu } from '../../state/recetas.ts'
import {
  anadirPropio,
  cantidad,
  compartirCompra,
  compraActual,
  DIAS_COMPRA,
  desdeElDia,
  desmarcarTodo,
  marcar,
  paraDias,
  productosDe,
  quitarPropio,
  racionesDeMas,
} from '../../use-cases/shopping.ts'
import { Barra } from '../comun/Barra.tsx'
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
  // Las que abres o cierras tú (al empezar, abierta la primera con algo por comprar y las que llevan algo tuyo)
  const [tocadas, setTocadas] = useState<string[]>([])
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  const volver = `${paths.nutrition}?vista=menu`
  if (!dieta.value && !menu.value.menus.some((x) => Object.keys(x.platos).length)) {
    return (
      <div class={p.page}>
        <Barra titulo="La compra" volver={volver} />
        <p class={p.sub}>La lista sale de tu menú o de tu dieta: pon platos en Comida · Menú.</p>
      </div>
    )
  }
  const c = compraActual()
  const { productos, entreno, descanso } = productosDe(c)
  const tienes = new Set(c.tienes)
  const total = productos.length + c.propios.length
  const hechos =
    productos.filter((x) => tienes.has(x.clave)).length + c.propios.filter((x) => tienes.has(x.id)).length
  const manana = addDays(hoy.value, 1)

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
        <button type="button" class={p.textButton} onClick={alguien.show}>
          <PlusIcon /> ¿Come alguien más?
        </button>
      </section>

      {SECCIONES.map((s) => {
        const de = productos.filter((x) => x.seccion === s.id)
        const suyos = c.propios.filter((x) => x.seccion === s.id)
        if (!de.length && !suyos.length) return null
        const faltan =
          de.filter((x) => !tienes.has(x.clave)).length + suyos.filter((x) => !tienes.has(x.id)).length
        const primera =
          SECCIONES.find((x) => productos.some((y) => y.seccion === x.id && !tienes.has(y.clave)))?.id ===
          s.id
        const abierta = (primera || suyos.length > 0) !== tocadas.includes(s.id)
        return (
          <section key={s.id} class={p.seccion} aria-labelledby={`sec-${s.id}`}>
            <h2 class={p.seccionTitulo}>
              <button
                type="button"
                id={`sec-${s.id}`}
                class={p.seccionAbrir}
                aria-expanded={abierta}
                onClick={() =>
                  setTocadas(tocadas.includes(s.id) ? tocadas.filter((x) => x !== s.id) : [...tocadas, s.id])
                }
              >
                <span>{s.nombre}</span>
                <span class={p.foot}>{faltan ? faltan : 'todo hecho'}</span>
                {faltan ? <ChevronDownIcon /> : <CheckIcon />}
              </button>
            </h2>
            {abierta && (
              <ul class={p.list}>
                {de.map((x) => (
                  <li key={x.clave}>
                    <button
                      type="button"
                      class={`${p.check} ${tienes.has(x.clave) ? p.checked : ''}`}
                      aria-pressed={tienes.has(x.clave)}
                      onClick={() => void marcar(x.clave)}
                    >
                      <span class={p.box} aria-hidden="true">
                        {tienes.has(x.clave) && <CheckIcon />}
                      </span>
                      <span class={p.rowText}>
                        <span class={p.rowTitle}>{x.nombre}</span>
                      </span>
                      <b class={p.qty}>{x.gramos ? cantidad(x.gramos) : 'al gusto'}</b>
                    </button>
                  </li>
                ))}
                {suyos.map((x) => (
                  <li key={x.id} class={p.withAction}>
                    <button
                      type="button"
                      class={`${p.check} ${tienes.has(x.id) ? p.checked : ''}`}
                      aria-pressed={tienes.has(x.id)}
                      onClick={() => void marcar(x.id)}
                    >
                      <span class={p.box} aria-hidden="true">
                        {tienes.has(x.id) && <CheckIcon />}
                      </span>
                      <span class={p.rowText}>
                        <span class={p.rowTitle}>{x.nombre}</span>
                        <span class={p.foot}>Añadido por ti</span>
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
            )}
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
