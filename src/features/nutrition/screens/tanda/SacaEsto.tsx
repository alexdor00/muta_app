// «Saca esto» del modo cocina, plegado por pasillos (usuario, 2026-11-20): cada pasillo es una fila con lo que lleva;
// al tocarla se abre, y al sacarlo todo se tacha y se pliega sola. Lo «al gusto» de aceites y especias, en una frase.
import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { enLista } from '../../state/autopilot.ts'
import { SECCIONES } from '../../state/dieta.ts'
import c from './Cocina.module.css'
import s from './SacaEsto.module.css'

export type ParaSacar = {
  clave: string
  nombre: string
  gramos: number | null
  crudo: boolean
  seccion: string
}

const cantidad = (x: ParaSacar) =>
  x.gramos === null ? 'al gusto' : `${formatInt(x.gramos)} g${x.crudo ? ' en crudo' : ''}`

/** «Cebolla, ajo, pimiento rojo y 2 más». */
function resumen(xs: ParaSacar[]): string {
  const n = xs.map((x, i) => (i ? x.nombre.toLowerCase() : x.nombre))
  if (n.length <= 3) return enLista(n)
  return `${n.slice(0, 3).join(', ')} y ${n.length - 3} más`
}

/** «sal, cilantro, pimienta negra y comino»: lo «al gusto» de varias recetas, cada cosa una vez. */
function alGustoJunto(xs: ParaSacar[]): string {
  const partes = xs.flatMap((x) =>
    x.nombre
      .toLowerCase()
      .replace(/\s*al gusto\s*$/, '')
      .split(/,\s*|\s+y\s+/),
  )
  const unicas = [...new Set(partes.map((p) => p.trim()).filter(Boolean))]
  return enLista(unicas)
}

export function SacaEsto({ cosas, solo }: { cosas: ParaSacar[]; solo?: boolean }) {
  const [sacado, setSacado] = useState<string[]>([])
  const [abiertos, setAbiertos] = useState<string[]>([])
  const pasillos = SECCIONES.map((sec) => ({ ...sec, de: cosas.filter((x) => x.seccion === sec.id) })).filter(
    (p) => p.de.length,
  )
  const listo = (p: (typeof pasillos)[number]) => p.de.every((x) => sacado.includes(x.clave))
  // Al sacar lo último de un pasillo, se pliega
  const marcar = (claves: string[], on: boolean, pasillo: string, todas: string[]) => {
    const nuevo = on ? sacado.filter((k) => !claves.includes(k)) : [...new Set([...sacado, ...claves])]
    setSacado(nuevo)
    if (todas.every((k) => nuevo.includes(k))) setAbiertos(abiertos.filter((a) => a !== pasillo))
  }

  return (
    <section class={c.seccion} aria-labelledby="saca">
      <div class={c.titulo}>
        <h2 id="saca">Saca esto</h2>
        <span>
          {pasillos.filter(listo).length} de {pasillos.length} listos
          {solo ? ' · esta receta' : ''}
        </span>
      </div>
      <ul class={s.tarjeta}>
        {pasillos.map((p) => {
          const todas = p.de.map((x) => x.clave)
          const hecho = listo(p)
          const abierto = abiertos.includes(p.id)
          const especias = p.id === 'aceites'
          const conGramos = especias ? p.de.filter((x) => x.gramos !== null) : p.de
          const alGusto = especias ? p.de.filter((x) => x.gramos === null) : []
          return (
            <li key={p.id}>
              <div class={`${s.pasillo} ${hecho ? s.hecho : ''}`}>
                <button
                  type="button"
                  class={`${c.circulo} ${hecho ? c.circuloOn : s.vacio}`}
                  aria-pressed={hecho}
                  aria-label={`${p.nombre}: todo sacado`}
                  onClick={() => marcar(todas, hecho, p.id, todas)}
                >
                  {hecho && <CheckIcon />}
                </button>
                <button
                  type="button"
                  class={s.abrir}
                  aria-expanded={abierto}
                  onClick={() =>
                    setAbiertos(abierto ? abiertos.filter((a) => a !== p.id) : [...abiertos, p.id])
                  }
                >
                  <span class={s.nombre}>
                    {p.nombre}
                    {!hecho && !abierto && <small>{resumen(p.de)}</small>}
                  </span>
                  <span class={s.cuenta}>{p.de.length}</span>
                  {abierto ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </button>
              </div>
              {abierto && (
                <ul class={s.dentro}>
                  {conGramos.map((x) => {
                    const on = sacado.includes(x.clave)
                    return (
                      <li key={x.clave}>
                        <button
                          type="button"
                          class={`${c.item} ${on ? c.marcado : ''}`}
                          aria-pressed={on}
                          onClick={() => marcar([x.clave], on, p.id, todas)}
                        >
                          <span class={c.circulo} aria-hidden="true">
                            {on && <CheckIcon />}
                          </span>
                          <span class={c.itemNombre}>{x.nombre}</span>
                          <b class={c.cantidad}>{cantidad(x)}</b>
                        </button>
                      </li>
                    )
                  })}
                  {alGusto.length > 0 && <li class={s.alGusto}>Al gusto: {alGustoJunto(alGusto)}.</li>}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
