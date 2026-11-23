import { useState } from 'preact/hooks'
import { addDays } from '../../../../shared/lib/format.ts'
import { CheckIcon, PlusIcon, ShareIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { LetraMenu } from '../../components/LetraMenu.tsx'
import { compraDeLaSemana, piloto, type PorComprar } from '../../state/autopilot.ts'
import { hoy } from '../../state/comida.ts'
import { SECCIONES } from '../../state/dieta.ts'
import { DIA_LARGO, diaSemana, enCrudo, menu, NOMBRE_DIA } from '../../state/recetas.ts'
import {
  basicoFalta,
  cadaCuantoCompras,
  cantidad,
  compartirCompra,
  compraActual,
  marcar,
  marcarComprado,
} from '../../use-cases/shopping.ts'
import s from './Compra.module.css'

type Props = {
  onAnadir: () => void
  avisar: (texto: string, accion?: { label: string; onClick: () => void }) => void
}

/** Especias y básicos: duran semanas, salen al final y ya tachados. */
const BASICOS = 'aceites'
const PERIODOS = [
  { n: 1, nombre: 'Cada semana', que: '7 días' },
  { n: 2, nombre: 'Cada 2 semanas', que: '14 días' },
  { n: 4, nombre: 'Cada mes', que: '28 días' },
]

/** «jue 19». */
const corto = (f: string) => `${NOMBRE_DIA[diaSemana(f)].toLowerCase()} ${Number(f.slice(8))}`

/**
 * La compra (usuario, 2026-11-19, `Desktop/MUTA-Compra.png`): arriba, para qué días y de qué menús, cuánto te falta y
 * cada cuánto compras; una fila de secciones (los pasillos) que se tocan; tachar con un tick gris; y, al final, las
 * especias y básicos ya tachados (los destachas si te faltan).
 */
export function CompraSemana({ onAnadir, avisar }: Props) {
  const [sel, setSel] = useState('todo')
  const [periodo, setPeriodo] = useState(false)
  const sem = compraDeLaSemana.value
  if (!sem) return null
  const c = compraActual()
  const tienes = new Set(c.tienes)
  const faltanBasicos = new Set(c.faltanBasicos ?? [])
  const normales = sem.faltan.filter((x) => x.seccion !== BASICOS)
  const basicos = sem.faltan.filter((x) => x.seccion === BASICOS)
  const quedanDe = (sec: string) =>
    normales.filter((x) => x.seccion === sec && !x.comprado).length +
    c.propios.filter((x) => x.seccion === sec && !tienes.has(x.id)).length
  const total = normales.length + c.propios.length + faltanBasicos.size
  const quedan =
    normales.filter((x) => !x.comprado).length +
    c.propios.filter((x) => !tienes.has(x.id)).length +
    basicos.filter((x) => faltanBasicos.has(x.clave)).length
  // Las secciones con algo: las que tienen pendientes delante; las completas, al final con ✓
  const secciones = SECCIONES.filter(
    (x) =>
      x.id !== BASICOS &&
      (normales.some((y) => y.seccion === x.id) || c.propios.some((y) => y.seccion === x.id)),
  ).sort((a, b) => Number(quedanDe(a.id) === 0) - Number(quedanDe(b.id) === 0))
  const semanas = piloto.value?.compra?.semanas ?? 1
  const compartir = async () => {
    const r = await compartirCompra()
    if (r === 'saved') avisar('Excel guardado en Descargas: compártelo desde ahí')
    if (r === 'copied') avisar('Lista copiada: pégala en Notas o WhatsApp')
  }
  // Al terminar una sección, la siguiente que falte
  const tras = (sec: string) => {
    if (sel === 'todo' || quedanDe(sec) > 1) return
    const sig = secciones.find((x) => x.id !== sec && quedanDe(x.id) > 0)
    if (sig) setSel(sig.id)
  }
  const fila = (x: PorComprar) => (
    <li key={x.clave}>
      <button
        type="button"
        class={`${s.item} ${x.comprado ? s.marcado : ''}`}
        aria-pressed={x.comprado}
        onClick={() => {
          if (!x.comprado) tras(x.seccion)
          void marcarComprado(x, sem.fecha)
        }}
      >
        <span class={s.circulo} aria-hidden="true">
          {x.comprado && <CheckIcon />}
        </span>
        <span class={s.itemTexto}>
          <span class={s.itemNombre}>{x.nombre}</span>
          {enCrudo(x.clave, x.gramos) && <span class={s.detalle}>{enCrudo(x.clave, x.gramos)}</span>}
        </span>
        <span class={s.cantidad}>{x.gramos ? cantidad(x.gramos) : 'al gusto'}</span>
      </button>
    </li>
  )
  const propios = (sec: string) =>
    c.propios
      .filter((x) => x.seccion === sec)
      .map((x) => (
        <li key={x.id}>
          <button
            type="button"
            class={`${s.item} ${tienes.has(x.id) ? s.marcado : ''}`}
            aria-pressed={tienes.has(x.id)}
            onClick={() => void marcar(x.id)}
          >
            <span class={s.circulo} aria-hidden="true">
              {tienes.has(x.id) && <CheckIcon />}
            </span>
            <span class={s.itemTexto}>
              <span class={s.itemNombre}>{x.nombre}</span>
              <span class={s.detalle}>Añadido por ti</span>
            </span>
          </button>
        </li>
      ))
  const verSecciones = sel === 'todo' ? secciones : secciones.filter((x) => x.id === sel)

  return (
    <>
      <section class={s.resumen} aria-labelledby="compra-titulo">
        <div class={s.resumenCabeza}>
          <span class={s.cabezaTexto}>
            <b id="compra-titulo">
              Compra {semanas === 1 ? 'de la semana' : semanas === 2 ? 'de 2 semanas' : 'del mes'}
            </b>
            <span>
              {sem.fecha === hoy.value ? 'Hoy' : DIA_LARGO[diaSemana(sem.fecha)]}, {sem.hora} · para{' '}
              {corto(sem.fecha)} – {corto(addDays(sem.hasta, -1))}
            </span>
          </span>
          <button type="button" class={s.periodo} onClick={() => setPeriodo(true)}>
            {PERIODOS.find((x) => x.n === semanas)?.nombre ?? 'Cada semana'} ▾
          </button>
        </div>
        <div class={s.menus}>
          {sem.menus.map((x) => (
            <span key={x.id} class={s.menu}>
              <LetraMenu id={x.id} indice={menu.value.menus.findIndex((k) => k.id === x.id)} />
              {x.dias} {x.dias === 1 ? 'día' : 'días'}
            </span>
          ))}
        </div>
        <div class={s.barra} aria-hidden="true">
          <i style={{ width: `${total ? ((total - quedan) / total) * 100 : 0}%` }} />
        </div>
        <div class={s.resumenPie}>
          <span>
            Te faltan <b>{quedan}</b> de {total} productos
          </span>
          <button
            type="button"
            class={s.redondo}
            aria-label="Añadir algo que no está en el menú"
            onClick={onAnadir}
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            class={s.redondo}
            aria-label="Compartir la lista"
            onClick={() => void compartir()}
          >
            <ShareIcon />
          </button>
        </div>
      </section>

      <div class={s.pastillas} role="group" aria-label="Secciones">
        <button type="button" aria-pressed={sel === 'todo'} onClick={() => setSel('todo')}>
          Todo · {quedan}
        </button>
        {secciones.map((x) => {
          const n = quedanDe(x.id)
          return (
            <button
              key={x.id}
              type="button"
              class={n ? '' : s.hecha}
              aria-pressed={sel === x.id}
              onClick={() => setSel(x.id)}
            >
              {n ? `${x.nombre} · ${n}` : `✓ ${x.nombre}`}
            </button>
          )
        })}
      </div>

      {verSecciones.map((sec) => (
        <section key={sec.id} class={s.seccion} aria-label={sec.nombre}>
          {sel === 'todo' && <h2 class={s.rotulo}>{sec.nombre}</h2>}
          <ul class={s.tarjeta}>
            {normales.filter((x) => x.seccion === sec.id).map(fila)}
            {propios(sec.id)}
          </ul>
        </section>
      ))}

      {basicos.length > 0 && (sel === 'todo' || quedanDe(sel) === 0) && (
        <section class={s.seccion} aria-labelledby="basicos">
          <h2 id="basicos" class={s.rotulo}>
            Especias y básicos · ya tachados
          </h2>
          <ul class={s.tarjeta}>
            {basicos.map((x) => {
              const tengo = !faltanBasicos.has(x.clave)
              return (
                <li key={x.clave}>
                  <button
                    type="button"
                    class={`${s.item} ${tengo ? s.marcado : ''}`}
                    aria-pressed={tengo}
                    onClick={() => void basicoFalta(x.clave)}
                  >
                    <span class={s.circulo} aria-hidden="true">
                      {tengo && <CheckIcon />}
                    </span>
                    <span class={s.itemTexto}>
                      <span class={s.itemNombre}>{x.nombre}</span>
                      {!tengo && <span class={s.detalle}>Te falta</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p class={s.nota}>Salen ya tachados: si en casa te falta uno, destáchalo antes de salir.</p>
        </section>
      )}

      {periodo && (
        <Sheet title="¿Cada cuánto compras?" onClose={() => setPeriodo(false)}>
          <p class={s.nota}>La lista lleva todo lo de tus menús hasta la siguiente compra.</p>
          <div class={s.periodos}>
            {PERIODOS.map((o) => (
              <button
                key={o.n}
                type="button"
                class={s.periodoOpcion}
                aria-pressed={semanas === o.n}
                onClick={() => {
                  setPeriodo(false)
                  if (semanas !== o.n) void cadaCuantoCompras(o.n)
                }}
              >
                <span>
                  <b>{o.nombre}</b>
                  <small>{o.que}</small>
                </span>
                {semanas === o.n && <CheckIcon />}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  )
}
