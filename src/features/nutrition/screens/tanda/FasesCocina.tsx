// Las fases del modo cocina de una tanda (rediseño 33 y 34): lo que sacas y un paso (repartir, en
// Repartir.tsx).
import { formatDuracion, formatInt } from '../../../../shared/lib/format.ts'
import { ClockIcon } from '../../../../shared/ui/icons.tsx'
import {
  enLista,
  fresco,
  paraCocinarEnTanda,
  partesDeTanda,
  piloto,
  racionEnTanda,
  platosDeTanda,
  type Tanda,
} from '../../state/autopilot.ts'
import { DeMas } from '../comun/DeMas.tsx'
import { parteDelPlato } from '../comun/parteDelPlato.ts'
import { seccionDe } from '../../state/dieta.ts'
import { fotos, platoPorId } from '../../state/recetas.ts'
import { textoMacros } from './RepartirPlato.tsx'
import a from '../comida/Anadir.module.css'
import { enCrudo } from './Cocinar.tsx'
import c from './Cocina.module.css'
import { SacaEsto, type ParaSacar } from './SacaEsto.tsx'

/** Rediseño 33: los platos de hoy con sus raciones y lo que sacas (las cantidades para todo), plegado por pasillos. */
export function Preparar({ t, solo, unPlato }: { t: Tanda; solo?: boolean; unPlato?: boolean }) {
  const p = piloto.value
  // Lo que dejas hecho de cada plato, dicho igual que en «3 Cocina»
  const platos = p
    ? partesDeTanda(t, p, (id) => platoPorId(id))
    : platosDeTanda(t).map((x) => ({ ...x, ahora: [], luego: [] }))
  // Lo que aporta una ración tuya de cada plato (usuario, 2026-11-22), la media de sus comidas
  const racion = (plato: string) => {
    const ms = t.huecos.filter((h) => h.plato === plato).flatMap((h) => racionEnTanda(t, h) ?? [])
    if (!ms.length) return null
    const f = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => ms.reduce((suma, m) => suma + m[k], 0) / ms.length
    return { kcal: f('kcal'), protein: f('protein'), carbs: f('carbs'), fat: f('fat') }
  }
  // Lo que sacas: lo de todos los platos sumado, en crudo lo que se cuece
  const juntos = new Map<string, ParaSacar>()
  for (const x of platos)
    for (const i of paraCocinarEnTanda(t, x.plato)) {
      const k = i.alimentoId ?? i.nombre
      const e = i.gramos === null ? null : enCrudo(i.alimentoId, i.nombre, i.gramos)
      const antes = juntos.get(k)
      juntos.set(k, {
        clave: k,
        nombre: e?.nombre ?? i.nombre,
        gramos: e ? (antes?.gramos ?? 0) + e.gramos : (antes?.gramos ?? null),
        crudo: !!e?.cocido || !!antes?.crudo,
        seccion: antes?.seccion ?? seccionDe(i.categoria, i.nombre),
      })
    }
  const frescos = [
    ...new Set(
      t.mixtos.flatMap((h) =>
        (platoPorId(h.plato)?.ingredientes ?? [])
          .filter((i) => i.cuenta && fresco(h.plato, i))
          .map((i) => i.nombre.toLowerCase()),
      ),
    ),
  ]
  return (
    <>
      <ul class={a.tarjeta}>
        {platos.map((x) => {
          const r = platoPorId(x.plato)
          const m = racion(x.plato)
          return (
            <li key={x.plato} class={c.platoCocina}>
              <div class={c.platoArriba}>
                <span
                  class={c.fotoGrande}
                  aria-hidden="true"
                  style={
                    fotos.value[x.plato] ? { backgroundImage: `url(${fotos.value[x.plato]})` } : undefined
                  }
                />
                <span class={a.filaTexto}>
                  <b class={c.nombre}>{r?.nombre ?? 'Plato'}</b>
                  <span class={a.detalle}>
                    {/* Un plato suelto (desde Cocinar): solo sus minutos; «Todo hecho» es de los días de cocina */}
                    {[unPlato ? null : parteDelPlato(x), r?.minutos ? formatDuracion(r.minutos) : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <DeMas t={t} plato={x.plato} />
              </div>
              {/* Lo que aporta una ración (usuario, 2026-11-22: «más bonita»): cuatro cifras en una franja */}
              {m && (
                <div class={c.platoCifras} aria-label={`1 ración: ${textoMacros(m)}`}>
                  {(
                    [
                      [formatInt(m.kcal), 'kcal'],
                      [`${formatInt(m.protein)} g`, 'proteína'],
                      [`${formatInt(m.carbs)} g`, 'hidratos'],
                      [`${formatInt(m.fat)} g`, 'grasa'],
                    ] as const
                  ).map(([v, l]) => (
                    <span key={l}>
                      <b>{v}</b>
                      <small>{l}</small>
                    </span>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <SacaEsto cosas={[...juntos.values()]} solo={solo} />
      {frescos.length > 0 && (
        <p class={c.nota}>
          <ClockIcon />
          Lo fresco, al momento: {enLista(frescos.slice(0, 3))} se hacen el día que comes.
        </p>
      )}
    </>
  )
}

/** Rediseño 34: un paso, con su plato y lo que lleva (los ingredientes que nombra); sin temporizador (usuario, 2026-11-19). */
export function Paso(props: {
  t: Tanda
  plato: string
  texto: string
  numero: number
  /** El paso que viene, para verlo venir. */
  siguiente?: string
}) {
  const { t, plato, texto } = props
  const r = platoPorId(plato)
  const [primera, ...resto] = texto.split(/(?<=\.)\s+/)
  const minutos = r?.minutosPasos?.[r.pasos.indexOf(texto)] ?? null
  const nombra = paraCocinarEnTanda(t, plato).filter((i) => {
    const palabra = i.nombre.toLowerCase().split(/[\s(]/)[0]
    return palabra.length > 2 && texto.toLowerCase().includes(palabra)
  })
  return (
    <article class={c.paso} aria-label="El paso">
      {/* Una tarjeta (usuario, 2026-11-22: «más bonito» y justificado): el plato, el número y el texto, sus minutos y lo
          que usas en filas como los ingredientes */}
      <div class={c.pasoTarjeta}>
        <span class={c.platoPaso}>
          <span
            class={c.foto}
            aria-hidden="true"
            style={fotos.value[plato] ? { backgroundImage: 'url(' + fotos.value[plato] + ')' } : undefined}
          />
          {r?.nombre}
        </span>
        <div class={c.pasoCuerpo}>
          <span class={c.pasoNumero} aria-hidden="true">
            {props.numero}
          </span>
          <div class={c.pasoTextos}>
            <h2 class={c.textoPaso}>{primera}</h2>
            {resto.length > 0 && <p class={c.restoPaso}>{resto.join(' ')}</p>}
            {minutos ? (
              <p class={c.minutosPaso}>
                <ClockIcon /> {minutos} min
              </p>
            ) : null}
          </div>
        </div>
        {nombra.length > 0 && (
          <ul class={c.usas} aria-label="Lo que usas">
            {nombra.map((i) => {
              const e = i.gramos === null ? null : enCrudo(i.alimentoId, i.nombre, i.gramos)
              return (
                <li key={i.texto}>
                  <span>{e?.nombre ?? i.nombre}</span>
                  {e && <b>{formatInt(e.gramos)} g</b>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {props.siguiente && (
        <p class={c.siguientePaso}>
          <small>Después</small>
          {props.siguiente}
        </p>
      )}
    </article>
  )
}
