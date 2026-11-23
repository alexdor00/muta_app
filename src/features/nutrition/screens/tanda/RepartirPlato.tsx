// Pesar lo cocinado y repartirlo (usuario, 2026-11-21), en cualquier modo cocina: todo mezclado (se pesa la olla) o cada
// cosa aparte (se pesa lo que se cuece: arroz, pasta, patata…; la proteína va por piezas, ya pesada en crudo). Da los
// macros por 100 g de lo cocinado y los gramos de cada recipiente; lo que rinde se guarda y la próxima vez se estima sin
// pesar, con «Pesar otra vez».
import { useState } from 'preact/hooks'
import { formatDecimal, formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { ScaleIcon } from '../../../../shared/ui/iconosHoy.tsx'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { repartirOlla } from '../../state/dieta.ts'
import { ollas, pesoDeLaComida, rindeDe, type ModoReparto } from '../../state/ollas.ts'
import { enCrudoDe, fotos, personas, platoPorId, totalCon } from '../../state/recetas.ts'
import { guardarRinde, modoDeReparto, ollaDeReceta } from '../../use-cases/ollas.ts'
import c from './Cocina.module.css'
import { OllaNueva } from './Ollas.tsx'

const num = (x: string | undefined) => parseDecimal(x ?? '') ?? 0
const sinCocido = (n: string) => n.replace(/\s*\(?cocid[oa]s?\)?/i, '').trim()

/** Un recipiente: su nombre y los gramos de cada ingrediente que van en él (lo que no va a la olla, a 0). */
export type Recipiente = { clave: string; dia: string; sub: string; gramos: readonly (number | null)[] }

type Macros = { kcal: number; protein: number; carbs: number; fat: number }

/** «590 kcal · P 42 · H 38 · G 28»: lo que aporta una ración (usuario, 2026-11-22). */
export const textoMacros = (m: Macros) =>
  `${formatInt(m.kcal)} kcal · P ${formatDecimal(m.protein)} · H ${formatDecimal(m.carbs)} · G ${formatDecimal(m.fat)}`

/** «142 kcal · P 12 · H 9 · G 6», por 100 g. */
function Por100({ m, de }: { m: Macros; de?: string }) {
  return (
    <span class={c.por100}>
      <b>{formatInt(m.kcal)}</b> kcal · P {formatDecimal(m.protein)} · H {formatDecimal(m.carbs)} · G{' '}
      {formatDecimal(m.fat)} <small>por 100 g{de ? ` de ${de}` : ''}</small>
    </span>
  )
}

const por = (m: Macros, f: number): Macros => ({
  kcal: m.kcal * f,
  protein: Math.round(m.protein * f * 10) / 10,
  carbs: Math.round(m.carbs * f * 10) / 10,
  fat: Math.round(m.fat * f * 10) / 10,
})

export function RepartirPlato(props: {
  plato: string
  recipientes: readonly Recipiente[]
  /** Cuánto crece la olla sobre lo tuyo (personas y raciones de más). */
  factor: number
  extra?: number
  base?: boolean
  /** Con varios recipientes, se tocan al llenarlos. */
  llenos?: string[]
  onLleno?: (k: string) => void
  /** Sin la foto y el nombre (cuando la receta ya está encima). */
  sinTitulo?: boolean
}) {
  const { plato, recipientes, factor } = props
  const extra = props.extra ?? 0
  const [pesando, setPesando] = useState(false)
  const [pesado, setPesado] = useState<Record<string, string>>({})
  const [enOlla, setEnOlla] = useState<string | null | undefined>(undefined)
  const [nueva, setNueva] = useState(false)
  const r = platoPorId(plato)
  if (!r || !recipientes.length) return null
  const n = recipientes.length
  const o = ollas.value
  // Lo que va a la olla (cada ingrediente, para todos) y, de eso, lo que se cuece (cambia de peso)
  const enOllaG = r.ingredientes.map((i, k) =>
    i.cuenta ? recipientes.reduce((s, x) => s + (x.gramos[k] ?? 0), 0) * factor : 0,
  )
  const indices = enOllaG.map((g, k) => (g > 0 ? k : -1)).filter((k) => k >= 0)
  // Lo poco (menos de 30 g por ración, como unas alubias en una ensalada) va a ojo
  const cocidos = indices.filter(
    (k) => enCrudoDe(r.ingredientes[k].alimentoId, enOllaG[k]) && enOllaG[k] / factor / n >= 30,
  )
  // Sugerido: cada cosa aparte si lleva algo que se cuece junto a otras cosas; si no, todo mezclado
  // Tu ración sola sin nada que se cueza (una tostada, un batido): no hay nada que pesar
  if (n === 1 && !extra && factor === 1 && !cocidos.length) return null
  const propuesto: ModoReparto = cocidos.length && cocidos.length < indices.length ? 'partes' : 'junto'
  const modo = cocidos.length ? (o.modo[plato] ?? propuesto) : 'junto'
  const macros = recipientes.map((x) => totalCon(r, x.gramos))

  // --- Todo mezclado: la olla entera ---
  const lista = o.lista
  const idOlla = enOlla !== undefined ? enOlla : (o.dePlato[plato] ?? lista[0]?.id ?? null)
  const olla = lista.find((x) => x.id === idOlla) ?? null
  const receta = enOllaG.reduce((a, b) => a + b, 0)
  const claveOlla = `olla:${plato}`
  const pesadoOlla = pesando ? pesoDeLaComida(num(pesado.olla), olla) : null
  const totalOlla = pesadoOlla ?? (!pesando && o.rinde[claveOlla] ? receta * o.rinde[claveOlla] : null)
  const neto = totalOlla ? totalOlla / factor : 0
  const suma = macros.reduce(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      protein: a.protein + m.protein,
      carbs: a.carbs + m.carbs,
      fat: a.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
  const gramosJunto = neto
    ? repartirOlla(
        neto,
        macros.map((m) => m.kcal),
      )
    : []

  // --- Cada cosa aparte: lo que se cuece, con su peso real (o el que aprendió) repartido como dice tu menú ---
  const partes = cocidos.map((k) => {
    const i = r.ingredientes[k]
    const clave = `ing:${i.alimentoId ?? i.nombre}`
    const real = pesando ? num(pesado[clave]) : 0
    const rinde = real > 0 ? real / enOllaG[k] : (o.rinde[clave] ?? null)
    return {
      k,
      clave,
      nombre: sinCocido(i.nombre),
      rinde,
      // Lo cocinado de verdad rinde distinto que la media de la base: sus valores por 100 g, en proporción
      por100: i.por100 && rinde ? por(i.por100, 1 / rinde) : null,
      deCada: recipientes.map((x) => Math.round((x.gramos[k] ?? 0) * (rinde ?? 1))),
    }
  })

  const estimado = !pesando && (modo === 'junto' ? !!totalOlla : partes.some((p) => p.rinde))
  const guardar = () => {
    if (modo === 'junto' && pesadoOlla) {
      const v = rindeDe(pesadoOlla, receta)
      if (v) void guardarRinde(claveOlla, v)
    }
    if (modo === 'partes')
      for (const p of partes) {
        const v = rindeDe(num(pesado[p.clave]), enOllaG[p.k])
        if (v) void guardarRinde(p.clave, v)
      }
  }
  const elegirOlla = (id: string | null) => {
    setEnOlla(id)
    void ollaDeReceta(plato, id)
  }
  const campo = (clave: string, etiqueta: string) => (
    <label class={c.pesoCaja}>
      <small>{etiqueta}</small>
      <span>
        <input
          inputMode="decimal"
          value={pesado[clave] ?? ''}
          placeholder="0"
          aria-label={`${etiqueta}, en gramos`}
          onInput={(e) => setPesado({ ...pesado, [clave]: e.currentTarget.value })}
          onChange={guardar}
        />
        g
      </span>
    </label>
  )
  const lineasDe = (x: number) =>
    modo === 'junto'
      ? gramosJunto.length
        ? [`${formatInt(gramosJunto[x])} g`]
        : []
      : partes.map((p) => `${p.nombre} ${formatInt(p.deCada[x])} g`)
  const recipiente = (k: string, dia: string, sub: string, lineas: string[], m?: Macros) => {
    const texto = (
      <span>
        <b>{dia}</b>
        <small>{sub}</small>
        {lineas.map((l) => (
          <b key={l} class={c.gramosRecipiente}>
            {l}
          </b>
        ))}
        {m && (
          <small class={c.macrosRecipiente}>
            {props.base ? 'Sin lo fresco: ' : ''}
            {textoMacros(m)}
          </small>
        )}
      </span>
    )
    if (!props.onLleno)
      return (
        <div key={k} class={c.recipiente}>
          {texto}
        </div>
      )
    const on = props.llenos?.includes(k) ?? false
    return (
      <button key={k} type="button" class={c.recipiente} aria-pressed={on} onClick={() => props.onLleno?.(k)}>
        {texto}
        <span class={`${c.circulo} ${on ? c.circuloOn : ''}`} aria-hidden="true">
          {on && <CheckIcon />}
        </span>
      </button>
    )
  }

  return (
    <section class={c.repartirPlato} aria-label={`Pesar ${r.nombre}`}>
      {!props.sinTitulo && (
        <div class={c.repartirTitulo}>
          <span
            class={c.foto}
            aria-hidden="true"
            style={fotos.value[plato] ? { backgroundImage: `url(${fotos.value[plato]})` } : undefined}
          />
          <span>
            <b>
              {r.nombre}
              {props.base ? ' · la base' : ''}
            </b>
            <small>
              {n + extra} {n + extra === 1 ? 'recipiente' : 'recipientes'}
              {personas.value > 1 && factor > 1
                ? ` tuyos · lo demás, para los otros ${personas.value - 1}`
                : ''}
            </small>
          </span>
        </div>
      )}
      {cocidos.length > 0 && (
        <div class={c.modoReparto} role="group" aria-label="Cómo lo has hecho">
          {(['partes', 'junto'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={modo === m}
              onClick={() => void modoDeReparto(plato, m)}
            >
              {m === 'junto' ? 'Todo mezclado' : 'Cada cosa aparte'}
            </button>
          ))}
        </div>
      )}
      {modo === 'partes' && !props.base && (
        <small class={c.notaReparto}>La proteína, por piezas: ya la pesaste en crudo.</small>
      )}
      {pesando && modo === 'junto' && (
        <div class={c.pesos}>
          <small class={c.pasoOlla}>1 · ¿En qué olla lo has hecho?</small>
          <div class={c.ollas} role="group" aria-label="En qué olla">
            {lista.map((x) => (
              <button
                key={x.id}
                type="button"
                class={c.ollaPill}
                aria-pressed={x.id === olla?.id}
                onClick={() => elegirOlla(x.id)}
              >
                {x.nombre}
              </button>
            ))}
            <button type="button" class={c.ollaPill} aria-pressed={!olla} onClick={() => elegirOlla(null)}>
              Sin olla
            </button>
            <button
              type="button"
              class={c.ollaPill}
              aria-label="Añadir una olla"
              onClick={() => setNueva(true)}
            >
              +
            </button>
          </div>
          {nueva && (
            <OllaNueva
              onGuardada={(x) => {
                setNueva(false)
                elegirOlla(x.id)
              }}
              onCancelar={() => setNueva(false)}
            />
          )}
          <small class={c.pasoOlla}>
            {olla
              ? `2 · Pesa la olla llena (vacía pesa ${formatInt(olla.gramos)} g)`
              : '2 · Pon un recipiente grande en la báscula, a cero, vuelca la olla y pésalo'}
          </small>
          {campo('olla', olla ? 'Olla llena' : 'La comida')}
          {!pesadoOlla && num(pesado.olla) > 0 && olla && (
            <small class={c.avisoOlla}>
              Pesa menos que la olla vacía ({formatInt(olla.gramos)} g): revisa el número o la olla.
            </small>
          )}
          {!lista.length && !nueva && (
            <button type="button" class={c.ollaLuego} onClick={() => setNueva(true)}>
              Cuando la friegues, pésala vacía y la guardo
            </button>
          )}
        </div>
      )}
      {pesando && modo === 'partes' && (
        <div class={c.pesos}>
          <small class={c.pasoOlla}>
            Pon un recipiente en la báscula, a cero, y pesa cada cosa ya cocida
          </small>
          {partes.map((p) => campo(p.clave, `${p.nombre} cocido`))}
        </div>
      )}
      {modo === 'junto' && neto > 0 && (
        <div class={c.resultadoOlla}>
          {suma.kcal > 0 && <Por100 m={por(suma, 100 / neto)} />}
          <small>
            {formatInt(totalOlla ?? 0)} g de comida
            {factor > 1 ? ` · ${formatInt(neto)} g son tuyos` : ''}
            {estimado ? ' · estimado con lo que pesó la última vez' : ''}
          </small>
        </div>
      )}
      {modo === 'partes' && partes.some((p) => p.por100) && (
        <div class={c.resultadoOlla}>
          {partes.map(
            (p) => p.por100 && <Por100 key={p.clave} m={p.por100} de={`${p.nombre.toLowerCase()} cocido`} />,
          )}
          {estimado && <small>Estimado con lo que pesó la última vez.</small>}
        </div>
      )}
      <div class={c.recipientes}>
        {recipientes.map((x, i) => recipiente(x.clave, x.dia, x.sub, lineasDe(i), macros[i]))}
        {Array.from({ length: extra }, (_, i) =>
          recipiente(
            `${plato}-de-mas-${i}`,
            'De más',
            '1 ración',
            modo === 'junto'
              ? neto
                ? [`${formatInt(neto / n)} g`]
                : []
              : partes.map((p) => `${p.nombre} ${formatInt(p.deCada.reduce((a, b) => a + b, 0) / n)} g`),
            por(suma, 1 / n),
          ),
        )}
      </div>
      <button type="button" class={c.pesar} onClick={() => setPesando(!pesando)}>
        <ScaleIcon />
        {pesando
          ? 'Ocultar'
          : estimado
            ? 'Pesar otra vez'
            : modo === 'junto'
              ? 'Pesar la olla'
              : partes.length === 1
                ? `Pesar el ${partes[0].nombre.toLowerCase()} cocido`
                : 'Pesar lo cocido'}
      </button>
    </section>
  )
}
