import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { carouselStep, useDragScroll } from '../../../../shared/ui/useDragScroll.ts'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { enCrudoDe } from '../../state/recetas.ts'
import s from './Tanda.module.css'
import c from './Cocina.module.css'

// Las piezas del modo cocina (una tanda o una comida al momento): lo que pesas en crudo y los pasos.

/** Lo que se cuece (el arroz, la pasta, las legumbres), en crudo: su nombre sin «cocido», sus gramos en crudo y lo que pesará cocido. */
export function enCrudo(alimentoId: string | null, nombre: string, gramos: number) {
  const crudo = enCrudoDe(alimentoId, gramos)
  const sinCocido = nombre.replace(/\s*\(?cocid[oa]s?\)?/i, '').trim()
  return {
    nombre: crudo ? sinCocido : nombre,
    gramos: crudo?.gramos ?? gramos,
    cocido: crudo ? gramos : null,
  }
}

/** Los pasos de una receta: se tachan al tocarlos. */
export function Pasos({ pasos }: { pasos: readonly string[] }) {
  const [hechos, setHechos] = useState<number[]>([])
  if (!pasos.length) return null
  return (
    <ol class={s.lista} aria-label="Pasos">
      {pasos.map((x, k) => {
        const on = hechos.includes(k)
        return (
          <li key={k}>
            <button
              type="button"
              class={`${s.paso} ${on ? s.pasoHecho : ''}`}
              aria-pressed={on}
              onClick={() => setHechos(on ? hechos.filter((y) => y !== k) : [...hechos, k])}
            >
              <span class={s.numero} aria-hidden="true">
                {on ? <CheckIcon /> : k + 1}
              </span>
              <span>{x}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** Un ingrediente de la receta tal como se pesa: su nombre (en crudo si se cuece), sus gramos (null: al gusto). */
export type IngredienteCocina = {
  clave: string
  nombre: string
  gramos: number | null
  cocido: number | null
  /** Ya está hecho (la base de tu táper): no se pesa hoy. */
  hecho?: boolean
}

/**
 * La receta de una comida al momento (rediseño, pantalla 36; usuario, 2026-11-17): su foto pequeña con el nombre y el
 * detalle, «Pesa para 1 ración» con un círculo para marcar lo que ya pesaste (lo de tu táper, «ya lo tienes hecho») y
 * los pasos numerados.
 */
export function RecetaCocina(props: {
  nombre: string
  foto: string | null
  /** «20 min · 676 kcal · 38 g prot.». */
  detalle: string
  ingredientes: readonly IngredienteCocina[]
  pasos: readonly string[]
  /** Una nota encima de los ingredientes («La base está en tu táper»). */
  nota?: string
}) {
  const [pesado, setPesado] = useState<string[]>([])
  const conGramos = props.ingredientes.filter((i) => i.gramos !== null)
  const alGusto = props.ingredientes
    .filter((i) => i.gramos === null)
    .map((i) => i.nombre.replace(/ al gusto$/i, ''))
  return (
    <article class={c.receta} aria-labelledby="receta">
      <header class={c.recetaCabeza}>
        <span
          class={c.recetaFoto}
          aria-hidden="true"
          style={props.foto ? { backgroundImage: `url(${props.foto})` } : undefined}
        />
        <span>
          <h2 id="receta" class={c.nombre}>
            {props.nombre}
          </h2>
          <span class={c.detalleReceta}>{props.detalle}</span>
        </span>
      </header>
      {props.nota && <p class={c.nota}>{props.nota}</p>}
      {conGramos.length > 0 && (
        <section class={c.seccion} aria-labelledby="pesa">
          <div class={c.titulo}>
            <h3 id="pesa">Pesa para 1 ración</h3>
          </div>
          <ul class={c.lista}>
            {conGramos.map((i) => {
              const on = i.hecho || pesado.includes(i.clave)
              return (
                <li key={i.clave}>
                  <button
                    type="button"
                    class={`${c.item} ${on ? c.marcado : ''}`}
                    aria-pressed={on}
                    disabled={i.hecho}
                    onClick={() => setPesado(on ? pesado.filter((y) => y !== i.clave) : [...pesado, i.clave])}
                  >
                    <span class={c.circulo} aria-hidden="true">
                      {on && <CheckIcon />}
                    </span>
                    <span class={c.itemNombre}>
                      {i.nombre}
                      {i.cocido !== null && <span class={c.detalleReceta}> · en crudo, a la olla</span>}
                    </span>
                    <b class={c.cantidad}>
                      {formatInt(i.gramos!)} g{i.hecho ? ' · ya lo tienes hecho' : ''}
                    </b>
                  </button>
                </li>
              )
            })}
          </ul>
          {alGusto.length > 0 && <p class={c.detalleReceta}>Al gusto: {alGusto.join(', ').toLowerCase()}</p>}
        </section>
      )}
      {props.pasos.length > 0 && (
        <section class={c.seccion} aria-labelledby="pasos-receta">
          <div class={c.titulo}>
            <h3 id="pasos-receta">Pasos</h3>
          </div>
          <ol class={c.pasosLista}>
            {props.pasos.map((x, k) => (
              <li key={k}>
                <span class={c.numeroPaso} aria-hidden="true">
                  {k + 1}
                </span>
                <span>{x}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  )
}

/**
 * Un carrusel que se desliza como el de tu rutina en Entreno (con el dedo o arrastrando), con sus puntos encima: cada
 * diapositiva, una receta (o tus tápers). Empieza en \`inicio\` y dice cuál se ve (\`onVisible\`).
 */
export function CarruselCocina(props: {
  etiqueta: string
  diapositivas: ComponentChildren[]
  visible: number
  inicio?: number
  onVisible: (i: number) => void
  /** Los puntos debajo de las tarjetas en vez de encima (el carrusel de días de Nutrición). */
  puntosAbajo?: boolean
}) {
  const carruselRef = useDragScroll<HTMLDivElement>()
  const puestoRef = useRef(false)
  // Al abrir, en la diapositiva de inicio (una vez)
  useEffect(() => {
    const el = carruselRef.current
    if (!el || puestoRef.current) return
    puestoRef.current = true
    if (props.inicio) el.scrollLeft = props.inicio * carouselStep(el)
  })
  // Los puntos: cuántas tarjetas hay y en cuál estás
  const puntos = props.diapositivas.length > 1 && (
    <div class={s.puntos} aria-hidden="true">
      {props.diapositivas.map((_, i) => (
        <span key={i} class={`${s.punto} ${i === props.visible ? s.puntoAqui : ''}`} />
      ))}
    </div>
  )
  return (
    <div class={`${s.carruselCaja} ${props.puntosAbajo ? s.puntosDebajo : ''}`}>
      {!props.puntosAbajo && puntos}
      <div
        ref={carruselRef}
        class={s.carrusel}
        role="group"
        aria-label={props.etiqueta}
        // Se puede mover con el teclado aunque sus tarjetas no lleven botones
        tabIndex={0}
        onScroll={(e) =>
          props.onVisible(Math.round(e.currentTarget.scrollLeft / carouselStep(e.currentTarget)))
        }
      >
        {props.diapositivas.map((d, i) => (
          <div key={i} class={s.diapositiva}>
            {d}
          </div>
        ))}
      </div>
      {props.puntosAbajo && puntos}
    </div>
  )
}
