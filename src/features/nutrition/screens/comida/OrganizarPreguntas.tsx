import type { ComponentChildren } from 'preact'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import {
  CalendarIcon,
  ClockIcon,
  FileIcon,
  MinusIcon,
  PlusIcon,
  SparkIcon,
} from '../../../../shared/ui/icons.tsx'
import { HORA_COMPRA, type Piloto, type Preparar } from '../../state/autopilot.ts'
import { COMIDAS, type ComidaId } from '../../state/comida.ts'
import { DIA_LARGO, LETRA_DIA } from '../../state/recetas.ts'
import o from './Organizar.module.css'

/** Los siete días en una fila de círculos; los elegidos, en negro. */
export function Dias(props: {
  elegido: (dia: number) => boolean
  etiqueta: (dia: number) => string
  onDia: (dia: number) => void
}) {
  return (
    <div class={o.dias}>
      {LETRA_DIA.map((l, dia) => (
        <button
          key={l}
          type="button"
          class={o.dia}
          aria-pressed={props.elegido(dia)}
          aria-label={props.etiqueta(dia)}
          onClick={() => props.onDia(dia)}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/** La hora, en su píldora gris. */
function Hora(props: { valor: string; etiqueta: string; onCambio: (h: string) => void }) {
  return (
    <input
      class={o.hora}
      type="time"
      aria-label={props.etiqueta}
      value={props.valor}
      onInput={(e) => e.currentTarget.value && props.onCambio(e.currentTarget.value)}
    />
  )
}

/** Una fila: su nombre a la izquierda y lo que se elige a la derecha. */
function Fila(props: { nombre: string; children: ComponentChildren }) {
  return (
    <div class={o.filaQ}>
      <span>{props.nombre}</span>
      {props.children}
    </div>
  )
}

/** Quién pone los días de cocina. */
type Quien = 'yo' | 'muta' | 'dieta' | 'no'
const quienDe = (p: Piloto): Quien =>
  p.cocina.modo === 'dieta'
    ? 'dieta'
    : p.cocina.modo === 'dias'
      ? 'yo'
      : p.cocina.modo === 'no'
        ? 'no'
        : 'muta'

/** Cómo elige MUTA: cuántas veces a la semana, al empezar cada menú o en tus descansos. */
type ComoMuta = 'veces' | 'menu' | 'descanso'

type ModoCompra = 'fijo' | 'no'
const modoCompra = (p: Piloto): ModoCompra => (p.compra ? 'fijo' : 'no')

const QUIEN = [
  { id: 'yo' as Quien, nombre: 'Mis días', que: 'Tú eliges qué días', Icono: CalendarIcon },
  { id: 'muta' as Quien, nombre: 'MUTA elige', que: 'Los días que mejor encajan', Icono: SparkIcon },
  { id: 'dieta' as Quien, nombre: 'Como tu dieta', que: 'Los días que dice', Icono: FileIcon },
  { id: 'no' as Quien, nombre: 'Al momento', que: 'Cada comida, ese día', Icono: ClockIcon },
]

/**
 * Cómo cocinas en tres preguntas (usuario, 2026-11-19, `Desktop/MUTA-Como-cocinas.png`: «todas las posibilidades, más
 * estético e intuitivo»): cuándo cocinas (tus días, MUTA —veces, al empezar cada menú o tus descansos—, tu dieta o al
 * momento) y a qué hora; qué dejas hecho, comida a comida; y cuándo y cada cuánto compras. Para cuántos, no: se dice
 * en cada plato con sus raciones de más (usuario, 2026-11-20).
 */
export function OrganizarPreguntas(props: {
  p: Piloto
  onCambiar: (x: Partial<Piloto>) => void
  /** Tu dieta dice qué días se cocina. */
  conDieta: boolean
}) {
  const { p, onCambiar: cambiar } = props
  const cocina = (x: Partial<Piloto['cocina']>) => cambiar({ cocina: { ...p.cocina, ...x } })
  const quien = quienDe(p)
  const veces = Math.min(7, Math.max(1, p.cocina.veces ?? 3))
  const compra = modoCompra(p)
  const horaCompra = p.compra?.hora ?? HORA_COMPRA
  const ponerQuien = (q: Quien) =>
    q === 'yo'
      ? cocina({ modo: 'dias', dias: p.cocina.dias.length ? p.cocina.dias : [0, 3] })
      : q === 'muta'
        ? cocina({ modo: 'veces', veces })
        : cocina({ modo: q })
  const ponerCompra = (x: Partial<NonNullable<Piloto['compra']>>) =>
    cambiar({ compra: { dia: p.compra?.dia ?? 5, hora: horaCompra, ...p.compra, ...x } })

  return (
    <>
      <h2 class={o.pregunta}>¿Cuándo cocinas?</h2>
      <section class={o.tarjeta} aria-label="Cuándo cocinas">
        <div class={o.quien} role="group" aria-label="Quién pone los días">
          {QUIEN.filter((x) => x.id !== 'dieta' || props.conDieta || quien === 'dieta').map((x) => (
            <button key={x.id} type="button" aria-pressed={quien === x.id} onClick={() => ponerQuien(x.id)}>
              <x.Icono />
              <b>{x.nombre}</b>
              <small>{x.que}</small>
            </button>
          ))}
        </div>
        {quien === 'yo' && (
          <Dias
            elegido={(d) => p.cocina.dias.includes(d)}
            etiqueta={(d) => `Cocinar el ${DIA_LARGO[d]}`}
            onDia={(d) =>
              cocina({
                dias: p.cocina.dias.includes(d)
                  ? p.cocina.dias.filter((x) => x !== d)
                  : [...p.cocina.dias, d].sort(),
              })
            }
          />
        )}
        {quien === 'muta' && (
          <div>
            <ChoiceSegmented<ComoMuta>
              name="org-muta"
              legend="Cómo elige MUTA los días"
              value={p.cocina.modo === 'menu' || p.cocina.modo === 'descanso' ? p.cocina.modo : 'veces'}
              onChange={(m) => cocina(m === 'veces' ? { modo: 'veces', veces } : { modo: m })}
              options={[
                { value: 'veces', label: 'Veces' },
                { value: 'menu', label: 'Al empezar menú' },
                { value: 'descanso', label: 'Mis descansos' },
              ]}
            />
          </div>
        )}
        {quien === 'muta' && p.cocina.modo === 'veces' && (
          <Fila nombre="Veces a la semana">
            <span class={o.paso}>
              <button
                type="button"
                aria-label="Una vez menos"
                disabled={veces <= 1}
                onClick={() => cocina({ modo: 'veces', veces: veces - 1 })}
              >
                <MinusIcon />
              </button>
              <b>{veces}</b>
              <button
                type="button"
                aria-label="Una vez más"
                disabled={veces >= 7}
                onClick={() => cocina({ modo: 'veces', veces: veces + 1 })}
              >
                <PlusIcon />
              </button>
            </span>
          </Fila>
        )}
        {quien !== 'no' && (
          <Fila nombre="Hora de cocinar">
            <Hora etiqueta="Hora de cocinar" valor={p.cocina.hora} onCambio={(hora) => cocina({ hora })} />
          </Fila>
        )}
      </section>

      {quien !== 'no' && (
        <>
          <h2 class={o.pregunta}>¿Qué dejas hecho?</h2>
          <section class={o.tarjeta} aria-label="Qué dejas hecho">
            {COMIDAS.map((c) => (
              <div key={c.id} class={o.comidaHecha}>
                <span>{c.nombre}</span>
                <ChoiceSegmented<Preparar>
                  name={`org-${c.id}`}
                  legend={`Qué dejas hecho ${c.el.startsWith('el ') ? `del ${c.el.slice(3)}` : `de ${c.el}`}`}
                  value={p.preparar[c.id as ComidaId] ?? 'momento'}
                  onChange={(v) => cambiar({ preparar: { ...p.preparar, [c.id]: v } })}
                  options={[
                    { value: 'taper', label: 'Todo' },
                    { value: 'mixto', label: 'Una parte' },
                    { value: 'momento', label: 'Al momento' },
                  ]}
                />
              </div>
            ))}
            <p class={o.nota}>
              <b>Todo:</b> listo para calentar. <b>Una parte:</b> lo que aguanta; la carne, el pescado y la
              verdura fresca, ese día. <b>Al momento:</b> lo haces ese día.
            </p>
          </section>
        </>
      )}

      <h2 class={o.pregunta}>¿Cuándo compras?</h2>
      <section class={o.tarjeta} aria-label="Cuándo compras">
        <ChoiceSegmented<ModoCompra>
          name="org-compra"
          legend="Cuándo compras"
          value={compra}
          onChange={(m) => (m === 'no' ? cambiar({ compra: null }) : ponerCompra({ conCocina: false }))}
          options={[
            { value: 'fijo', label: 'Un día fijo' },
            { value: 'no', label: 'Sin día' },
          ]}
        />
        {compra === 'fijo' && (
          <Dias
            elegido={(d) => p.compra?.dia === d}
            etiqueta={(d) => `Comprar el ${DIA_LARGO[d]}`}
            onDia={(dia) => ponerCompra({ dia, conCocina: false })}
          />
        )}
        {compra === 'fijo' && (
          <Fila nombre="Cada cuánto">
            <div class={o.estrecho}>
              <ChoiceSegmented<string>
                name="org-semanas"
                legend="Cada cuánto compras"
                value={String(p.compra?.semanas ?? 1)}
                onChange={(v) => ponerCompra({ semanas: Number(v) })}
                options={[
                  { value: '1', label: 'Semana' },
                  { value: '2', label: '2 sem.' },
                  { value: '4', label: 'Mes' },
                ]}
              />
            </div>
          </Fila>
        )}
        {compra !== 'no' && (
          <Fila nombre="Hora de comprar">
            <Hora
              etiqueta="Hora de la compra"
              valor={horaCompra}
              onCambio={(hora) => ponerCompra({ hora })}
            />
          </Fila>
        )}
      </section>
    </>
  )
}
