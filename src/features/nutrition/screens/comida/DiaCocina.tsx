import { useState } from 'preact/hooks'
import { formatDuracion } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import {
  enLista,
  minutosDeTanda,
  partesDeTanda,
  piloto,
  tandasCon,
  type Piloto,
  type Tanda,
} from '../../state/autopilot.ts'
import { hoy } from '../../state/comida.ts'
import { DIA_LARGO, diaSemana, NOMBRE_DIA, platoPorId } from '../../state/recetas.ts'
import { aplicarPiloto, volverAlPiloto } from '../../use-cases/autopilot.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import o from './Organizar.module.css'

/** La hora, a la derecha del título de su tarjeta. */
export function Hora(props: { valor: string; etiqueta: string; onCambio: (h: string) => void }) {
  return (
    <label class={o.aLas}>
      a las
      <input
        class={o.hora}
        type="time"
        aria-label={props.etiqueta}
        value={props.valor}
        onInput={(e) => props.onCambio(e.currentTarget.value)}
      />
    </label>
  )
}

/** El día, como en una agenda: «HOY 16», «DOM 22». */
export function Fecha({ fecha }: { fecha: string }) {
  return (
    <span class={o.fecha}>
      <small>{fecha === hoy.value ? 'Hoy' : NOMBRE_DIA[diaSemana(fecha)]}</small>
      <b>{Number(fecha.slice(8))}</b>
    </span>
  )
}

/** «El domingo», «Hoy». */
export const elDia = (f: string) => (f === hoy.value ? 'Hoy' : `El ${DIA_LARGO[diaSemana(f)]}`)

/** «arroz, cebolla, pimiento y 2 más». */
function ingredientes(xs: readonly string[]): string {
  const n = xs.map((x) => x.toLowerCase())
  return n.length > 4 ? `${n.slice(0, 3).join(', ')} y ${n.length - 3} más` : enLista(n)
}

/**
 * Cada plato de un día de cocina (usuario, 2026-11-16: «cuándo se cocina cada plato y qué parte»): su nombre con sus
 * raciones, lo que cocinas ese día y lo que haces al comer.
 */
export function ListaPartes({ t, p, cuando }: { t: Tanda; p: Piloto; cuando: string }) {
  return (
    <ul class={o.partes}>
      {partesDeTanda(t, p, (id) => platoPorId(id)).map((x) => (
        <li key={x.plato}>
          <span class={o.parteNombre}>
            {platoPorId(x.plato)?.nombre ?? 'Plato'} ×{x.raciones}
          </span>
          {x.ahora.length > 0 && (
            <span class={o.detalle}>
              {cuando}: {ingredientes(x.ahora)}
            </span>
          )}
          {x.luego.length > 0 && <span class={o.detalle}>Al comer: {ingredientes(x.luego)}</span>}
        </li>
      ))}
    </ul>
  )
}

/** El día de cocina de una fecha, con lo que saldría con estos ajustes (lo de antes de hoy, como esté guardado). */
export function tandaDe(p: Piloto, fecha: string): Tanda | null {
  const hoyEs = hoy.value
  const prueba = { ...p, tandas: (piloto.value?.tandas ?? []).filter((f) => f < hoyEs), desde: hoyEs }
  return tandasCon(prueba).find((t) => t.fecha === fecha) ?? null
}

/**
 * Un día de cocina: su hora y lo que cocinas en total, plato a plato y por partes. Qué se deja hecho lo decide «Cómo
 * cocinas» (usuario, 2026-11-21: sin marcar cada día aparte).
 */
export function DiaCocina({
  t,
  p,
  onCambiar,
}: {
  t: Tanda
  p: Piloto
  onCambiar: (x: Partial<Piloto>) => void
}) {
  const min = minutosDeTanda(t)
  return (
    <>
      <section class={o.tarjeta} aria-label="A qué hora">
        <div class={o.cabeza}>
          <h3 class={o.titulo}>¿A qué hora cocinas?</h3>
          <Hora
            etiqueta="Hora de cocinar"
            valor={t.hora}
            onCambio={(hora) => onCambiar({ horas: { ...p.horas, [t.fecha]: hora || t.hora } })}
          />
        </div>
      </section>
      <section class={o.tarjeta} aria-label="Cocinas en total">
        <div class={o.cabeza}>
          <h3 class={o.titulo}>
            Cocinas {t.huecos.length} {t.huecos.length === 1 ? 'ración' : 'raciones'}
          </h3>
          {min ? <span class={o.cifra}>≈ {formatDuracion(min)}</span> : null}
        </div>
        {t.huecos.length > 0 && <ListaPartes t={t} p={p} cuando={elDia(t.fecha)} />}
      </section>
    </>
  )
}

/**
 * Un día de cocina desde Tu semana: se abre con lo que tienes guardado y «Guardar» lo aplica (con «Deshacer»).
 */
export function DiaCocinaHoja(props: {
  fecha: string
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}) {
  const [p, setP] = useState<Piloto | null>(() => piloto.value)
  if (!p) return null
  const t = tandaDe(p, props.fecha)
  if (!t) return null
  async function guardar() {
    const antes = await aplicarPiloto(p!)
    props.onClose()
    props.avisar(`${elDia(props.fecha)} cocinas a las ${t!.hora}`, {
      label: 'Deshacer',
      onClick: () => void volverAlPiloto(antes),
    })
  }
  return (
    <Sheet
      title={`${elDia(props.fecha)} cocinas`}
      onClose={props.onClose}
      large
      footer={
        <div class={h.actions}>
          <Button onClick={() => void guardar()}>Guardar</Button>
          <button type="button" class={h.textButton} onClick={props.onClose}>
            Ahora no
          </button>
        </div>
      }
    >
      <div class={h.stack}>
        <DiaCocina t={t} p={p} onCambiar={(x) => setP({ ...p, ...x })} />
      </div>
    </Sheet>
  )
}
