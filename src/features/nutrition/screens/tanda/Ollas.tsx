// Tus ollas (usuario, 2026-11-21; `Desktop/MUTA-Ollas-propuesta.png`): lo que pesa cada una vacía se guarda una vez; al
// repartir solo pesas la olla llena. Aquí, las piezas: la «!» que explica cómo va, una olla nueva, el aviso del modo
// cocina (pequeño, para que no moleste) y la lista para editarlas.
import { useState } from 'preact/hooks'
import { formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { ScaleIcon } from '../../../../shared/ui/iconosHoy.tsx'
import { ChevronDownIcon, CloseIcon } from '../../../../shared/ui/icons.tsx'
import { hoy } from '../../state/comida.ts'
import { avisoOllaFuera, ollas, type Olla } from '../../state/ollas.ts'
import { borrarOlla, guardarOlla } from '../../use-cases/ollas.ts'
import s from './Ollas.module.css'

/** La «!»: al tocarla, en dos frases cómo funciona. */
export function InfoOllas() {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <button
        type="button"
        class={s.info}
        aria-expanded={abierta}
        aria-label="Cómo funciona pesar la olla"
        onClick={() => setAbierta(!abierta)}
      >
        !
      </button>
      {abierta && (
        <span class={s.explica}>
          Si va todo mezclado, pesas la olla llena (le resto lo que pesa vacía); si va cada cosa aparte, solo
          lo que se cuece, como el arroz. Te digo los gramos de cada recipiente y, la próxima vez, los calculo
          sin pesar.
        </span>
      )}
    </>
  )
}

/** Nombre y lo que pesa vacía, con «Guardar». */
export function OllaNueva(props: { olla?: Olla; onGuardada: (o: Olla) => void; onCancelar?: () => void }) {
  const [nombre, setNombre] = useState(props.olla?.nombre ?? '')
  const [gramos, setGramos] = useState(props.olla ? String(props.olla.gramos) : '')
  const g = parseDecimal(gramos) ?? 0
  return (
    <div class={s.nueva}>
      <div class={s.campos}>
        <input
          class={s.campo}
          value={nombre}
          placeholder="Olla grande"
          aria-label="Nombre de la olla"
          onInput={(e) => setNombre(e.currentTarget.value)}
        />
        <label class={`${s.campo} ${s.gramos}`}>
          <input
            inputMode="decimal"
            value={gramos}
            placeholder="0"
            aria-label="Lo que pesa vacía, en gramos"
            onInput={(e) => setGramos(e.currentTarget.value)}
          />
          g
        </label>
      </div>
      <div class={s.botones}>
        <button
          type="button"
          class={s.guardar}
          disabled={g <= 0}
          onClick={async () => props.onGuardada(await guardarOlla(nombre, g, props.olla?.id))}
        >
          Guardar
        </button>
        {props.onCancelar && (
          <button type="button" class={s.enlace} onClick={props.onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * En el modo cocina, arriba, mientras no tengas ninguna olla y hoy haya algo que repartir: una línea pequeña; «Pesar»
 * abre la olla nueva y la «×» la quita por hoy.
 */
export function AvisoOlla({ hayQueRepartir }: { hayQueRepartir: boolean }) {
  const [abierto, setAbierto] = useState(false)
  if (!hayQueRepartir || ollas.value.lista.length || avisoOllaFuera.value === hoy.value) return null
  return (
    <section class={s.aviso} aria-label="Pesar la olla">
      <div class={s.linea}>
        <ScaleIcon />
        <span class={s.texto}>Antes de echar nada, pesa la olla vacía</span>
        <InfoOllas />
        {!abierto && (
          <button type="button" class={s.pesar} onClick={() => setAbierto(true)}>
            Pesar
          </button>
        )}
        <button
          type="button"
          class={s.quitar}
          aria-label="Ahora no"
          onClick={() => (avisoOllaFuera.value = hoy.value)}
        >
          <CloseIcon />
        </button>
      </div>
      {abierto && <OllaNueva onGuardada={() => setAbierto(false)} onCancelar={() => setAbierto(false)} />}
    </section>
  )
}

/** Tus ollas, en Mi plan › Cocina: tocar una la edita; la «×» la borra. */
export function TusOllas() {
  const [editando, setEditando] = useState<string | null>(null)
  // Sale plegada (usuario, 2026-11-21): al tocar «Tus ollas», se despliega
  const [abierta, setAbierta] = useState(false)
  const lista = ollas.value.lista
  return (
    <section class={s.tus} aria-label="Tus ollas">
      <div class={s.cabeza}>
        <button type="button" class={s.plegar} aria-expanded={abierta} onClick={() => setAbierta(!abierta)}>
          <b class={s.titulo}>Tus ollas</b>
          {!abierta && lista.length > 0 && <small>{lista.length}</small>}
          <span class={`${s.flecha} ${abierta ? s.girada : ''}`} aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </button>
        <InfoOllas />
      </div>
      {abierta && (
        <ul class={s.lista}>
          {lista.map((o) =>
            editando === o.id ? (
              <li key={o.id}>
                <OllaNueva
                  olla={o}
                  onGuardada={() => setEditando(null)}
                  onCancelar={() => setEditando(null)}
                />
              </li>
            ) : (
              <li key={o.id} class={s.fila}>
                <button type="button" class={s.olla} onClick={() => setEditando(o.id)}>
                  <span>{o.nombre}</span>
                  <small>{formatInt(o.gramos)} g</small>
                </button>
                <button
                  type="button"
                  class={s.quitar}
                  aria-label={`Borrar ${o.nombre}`}
                  onClick={() => void borrarOlla(o.id)}
                >
                  <CloseIcon />
                </button>
              </li>
            ),
          )}
          <li>
            {editando === 'nueva' ? (
              <OllaNueva onGuardada={() => setEditando(null)} onCancelar={() => setEditando(null)} />
            ) : (
              <button type="button" class={s.anadir} onClick={() => setEditando('nueva')}>
                + Añadir una olla
              </button>
            )}
          </li>
        </ul>
      )}
    </section>
  )
}
