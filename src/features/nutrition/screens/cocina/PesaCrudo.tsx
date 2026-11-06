import { useState } from 'preact/hooks'
import { formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { ChoiceChips } from '../../../../shared/ui/Choice.tsx'
import { MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { COMIDAS, hoy } from '../../state/comida.ts'
import { gramosDeHueco, menu, platoPorId, totalCon } from '../../state/recetas.ts'
import p from '../comun/Pagina.module.css'
import h from '../comun/Hojas.module.css'

/** Los platos de tus menús, sin repetir (con la comida en la que van, para sus gramos). */
function platosDeTusMenus() {
  const vistos = new Map<string, { id: string; menu: string; comida: (typeof COMIDAS)[number]['id'] }>()
  for (const m of menu.value.menus)
    for (const c of COMIDAS) {
      const id = m.platos[c.id]
      if (id && !vistos.has(id)) vistos.set(id, { id, menu: m.id, comida: c.id })
    }
  return [...vistos.values()]
}

/**
 * Pesa en crudo, come cocinado: para un plato de tus menús que cocinas para varias comidas. Pesas los ingredientes en
 * crudo (salen con los gramos de tu menú por las raciones), pesas el plato hecho y te dice las kcal de cada 100 g y cuánto
 * servirte.
 */
export function PesaCrudo({ inicial }: { inicial: { plato?: string; raciones?: number } }) {
  const lista = platosDeTusMenus()
  const [id, setId] = useState(
    inicial.plato && lista.some((x) => x.id === inicial.plato) ? inicial.plato : lista[0]?.id,
  )
  const [raciones, setRaciones] = useState(Math.max(1, inicial.raciones ?? 2))
  const [cambiados, setCambiados] = useState<Record<string, string>>({})
  const [cocinado, setCocinado] = useState('')
  const elegido = lista.find((x) => x.id === id)
  const plato = elegido ? platoPorId(elegido.id) : null
  if (!elegido || !plato) return null
  const g = gramosDeHueco(
    { fecha: hoy.value, comida: elegido.comida, menu: elegido.menu, plato: plato.id, cocinado: null },
    plato,
  )
  const enCrudo = plato.ingredientes.map((i, k) => {
    if (!i.cuenta || i.gramos === null) return null
    const propio = parseDecimal(cambiados[`${plato.id}|${k}`] ?? '')
    return propio ?? Math.round((g[k] ?? i.gramos) * raciones)
  })
  const total = totalCon(
    plato,
    enCrudo.map((x) => (x === null ? null : x / raciones)),
    [],
    raciones,
  )
  const peso = parseDecimal(cocinado)
  const por100 = peso ? Math.round((total.kcal / peso) * 100) : null
  return (
    <section class={p.card} aria-labelledby="pesa-crudo">
      <h2 id="pesa-crudo" class={p.cardTitle}>
        Pesa en crudo, come cocinado
      </h2>
      <p class={p.foot}>Pesa los ingredientes en crudo, pesa el plato ya hecho y te digo cuánto servirte.</p>
      <ChoiceChips<string>
        name="pesa-plato"
        legend="Plato"
        options={lista.map((x) => ({ value: x.id, label: platoPorId(x.id)?.nombre ?? x.id }))}
        value={elegido.id}
        onChange={(x) => {
          setId(x)
          setCocinado('')
        }}
      />
      <div class={h.line}>
        <span>Raciones que cocinas</span>
        <span class={h.miniStepper}>
          <button
            type="button"
            aria-label="Una ración menos"
            disabled={raciones <= 1}
            onClick={() => setRaciones(raciones - 1)}
          >
            <MinusIcon />
          </button>
          <b>{raciones}</b>
          <button
            type="button"
            aria-label="Una ración más"
            onClick={() => setRaciones(Math.min(12, raciones + 1))}
          >
            <PlusIcon />
          </button>
        </span>
      </div>
      <ul class={p.list}>
        {plato.ingredientes.map((i, k) =>
          enCrudo[k] === null ? null : (
            <li key={`${i.texto}-${k}`} class={p.row}>
              <span class={p.rowText}>
                <span class={p.rowTitle}>{i.nombre}</span>
              </span>
              <label class={p.gramsField}>
                <input
                  inputMode="decimal"
                  aria-label={`${i.nombre} en crudo (g)`}
                  value={cambiados[`${plato.id}|${k}`] ?? String(enCrudo[k])}
                  onInput={(e) => setCambiados({ ...cambiados, [`${plato.id}|${k}`]: e.currentTarget.value })}
                />
                g
              </label>
            </li>
          ),
        )}
      </ul>
      <p class={p.foot}>
        En crudo, para {raciones} {raciones === 1 ? 'ración' : 'raciones'}: {formatInt(total.kcal)} kcal y{' '}
        {formatInt(total.protein)} g de proteína. Si has pesado otra cosa, cambia la cantidad.
      </p>
      <label class={h.field}>
        Peso cocinado total (g)
        <input
          inputMode="decimal"
          placeholder="Lo hecho, sin la olla"
          value={cocinado}
          onInput={(e) => setCocinado(e.currentTarget.value)}
        />
      </label>
      <p class={p.result}>
        <span class={p.sub}>Sírvete por ración</span>
        <b class={p.number}>{peso ? `${formatInt(peso / raciones)} g` : '—'}</b>
      </p>
      {por100 !== null && (
        <p class={p.foot}>
          {formatInt(por100)} kcal cada 100 g cocinados · {formatInt(total.kcal / raciones)} kcal por ración.
        </p>
      )}
    </section>
  )
}

/** Cómo pesar la comida (del prototipo anterior). */
export function ComoPesar() {
  return (
    <section class={p.card} aria-labelledby="como-pesar">
      <h2 id="como-pesar" class={p.cardTitle}>
        Cómo pesar la comida
      </h2>
      <ul class={h.list}>
        <li class={p.foot}>Pesa en crudo el arroz, la pasta, la carne y el pescado.</li>
        <li class={p.foot}>Pesa el aceite siempre.</li>
        <li class={p.foot}>Lo cocinado junto: pesa la olla vacía y llena, y reparte por raciones.</li>
      </ul>
    </section>
  )
}
