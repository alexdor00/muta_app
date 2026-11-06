import { useEffect, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { estadoRecetas } from '../../state/recetas.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { ComoPesar, PesaCrudo } from './PesaCrudo.tsx'
import { formatDecimal, formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceCircles } from '../../../../shared/ui/Choice.tsx'
import { SearchIcon, TrashIcon } from '../../../../shared/ui/icons.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { base, dieta, estado, type Alimento } from '../../state/comida.ts'
import { factorDe, platoPor100, racionDeOlla } from '../../state/dieta.ts'
import { buscar, cargarAlimentos } from '../../use-cases/foodLog.ts'
import { arrozDeLosDias, guardarFactorArroz, guardarPlato } from '../../use-cases/kitchen.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { Barra } from '../comun/Barra.tsx'
import h from '../comun/Hojas.module.css'
import p from '../comun/Pagina.module.css'
import { useAviso } from '../comun/useAviso.ts'

const num = (s: string) => parseDecimal(s) ?? 0

/** Cocina: pesa en crudo y come cocinado (un plato de tus menús), cuánto arroz cocer y cuánto pesa cocido, repartir una olla en raciones y calcular un plato tuyo por 100 g. */
export function CocinaScreen() {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  const { query } = useLocation()
  const { aviso, avisar } = useAviso()
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  const volver = query.desde === 'menu' ? `${paths.nutrition}?vista=menu` : `${paths.nutrition}?vista=dieta`
  return (
    <div class={p.page}>
      <Barra titulo="Cocina" volver={volver} />
      <PesaCrudo inicial={{ plato: query.plato, raciones: Number(query.raciones) || undefined }} />
      {dieta.value && <Arroz />}
      <Olla />
      <Plato avisar={avisar} />
      <ComoPesar />
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}

function Arroz() {
  const [dias, setDias] = useState(2)
  const [crudo, setCrudo] = useState('')
  const [cocido, setCocido] = useState('')
  const arroz = arrozDeLosDias(dias)
  const factor = dieta.value?.factorArroz ?? 3
  if (!arroz.recetas.length) return null
  return (
    <section class={p.card} aria-labelledby="arroz">
      <h2 id="arroz" class={p.cardTitle}>
        La olla de arroz
      </h2>
      <ChoiceCircles
        name="dias-arroz"
        legend="Para cuántos días"
        showLegend
        options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
        value={dias}
        onChange={setDias}
      />
      <p class={p.sub}>
        Cuece <b>{formatInt(arroz.crudo)} g</b> en crudo: unos {formatInt(arroz.crudo * factor)} g cocido.
      </p>
      <ul class={p.list}>
        {arroz.recetas.map((r, i) => (
          <li key={`${r.nombre}-${i}`} class={p.result}>
            <span class={p.rowText}>
              <span>{r.nombre}</span>
              <span class={p.foot}>{formatInt(r.crudo)} g en crudo</span>
            </span>
            <b class={p.qty}>{formatInt(r.cocido)} g cocido</b>
          </li>
        ))}
      </ul>
      <span class={p.eyebrow}>Tu arroz cocido pesa × {formatDecimal(factor)}</span>
      <div class={h.fields}>
        <label class={h.field}>
          Pesé en crudo (g)
          <input inputMode="decimal" value={crudo} onInput={(e) => setCrudo(e.currentTarget.value)} />
        </label>
        <label class={h.field}>
          Y ya cocido (g)
          <input inputMode="decimal" value={cocido} onInput={(e) => setCocido(e.currentTarget.value)} />
        </label>
      </div>
      <Button
        variant="secondary"
        disabled={factorDe(num(crudo), num(cocido)) === null}
        onClick={() => {
          const f = factorDe(num(crudo), num(cocido))
          if (f) void guardarFactorArroz(f)
        }}
      >
        Usar mi factor
        {factorDe(num(crudo), num(cocido))
          ? ` (× ${formatDecimal(factorDe(num(crudo), num(cocido)) ?? 0)})`
          : ''}
      </Button>
      <p class={p.foot}>Cada arroz y cada olla absorben distinto: mídelo una vez y la app lo recuerda.</p>
    </section>
  )
}

function Olla() {
  const [vacia, setVacia] = useState('')
  const [llena, setLlena] = useState('')
  const [raciones, setRaciones] = useState('2')
  const cada = racionDeOlla(num(vacia), num(llena), num(raciones))
  return (
    <section class={p.card} aria-labelledby="olla">
      <h2 id="olla" class={p.cardTitle}>
        Repartir una olla
      </h2>
      <div class={p.inputs}>
        <label class={h.field}>
          Olla vacía (g)
          <input inputMode="decimal" value={vacia} onInput={(e) => setVacia(e.currentTarget.value)} />
        </label>
        <label class={h.field}>
          Llena (g)
          <input inputMode="decimal" value={llena} onInput={(e) => setLlena(e.currentTarget.value)} />
        </label>
        <label class={h.field}>
          Raciones
          <input inputMode="numeric" value={raciones} onInput={(e) => setRaciones(e.currentTarget.value)} />
        </label>
      </div>
      <p class={p.result}>
        <span class={p.sub}>Cada ración</span>
        <b class={p.number}>{cada ? `${formatInt(cada)} g` : '—'}</b>
      </p>
      <p class={p.foot}>
        Para un plato cocinado junto: pon el plato en la báscula, a cero, y sirve hasta ese peso. Si comen dos
        más, la receta ×3 y 3 raciones.
      </p>
    </section>
  )
}

type Parte = { alimento: Alimento; gramos: string }

function Plato({ avisar }: { avisar: (t: string) => void }) {
  const [nombre, setNombre] = useState('')
  const [partes, setPartes] = useState<Parte[]>([])
  const [texto, setTexto] = useState('')
  const [cocinado, setCocinado] = useState('')
  const [racion, setRacion] = useState('')
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const calculo = platoPor100(
    partes.map((x) => ({ por100: x.alimento, gramos: num(x.gramos) })),
    num(cocinado),
  )
  const lista = texto.trim() && base.value ? buscar(texto).slice(0, 8) : []
  return (
    <section class={p.card} aria-labelledby="plato">
      <h2 id="plato" class={p.cardTitle}>
        Calcular un plato
      </h2>
      <p class={p.sub}>
        Lo que echas en crudo y lo que pesa ya cocinado: te da sus valores por 100 g y lo guarda.
      </p>
      <label class={h.field}>
        Nombre
        <input
          value={nombre}
          placeholder="Lentejas de mi madre"
          onInput={(e) => setNombre(e.currentTarget.value)}
        />
      </label>
      {partes.length > 0 && (
        <ul class={p.list}>
          {partes.map((x, i) => (
            <li key={`${x.alimento.id}-${i}`} class={p.withAction}>
              <span class={p.rowText}>{x.alimento.name}</span>
              <label class={`${h.field} ${p.gramsField}`}>
                <input
                  inputMode="decimal"
                  aria-label={`Gramos en crudo de ${x.alimento.name}`}
                  value={x.gramos}
                  onInput={(e) => {
                    const g = e.currentTarget.value
                    setPartes((ps) => ps.map((y, k) => (k === i ? { ...y, gramos: g } : y)))
                  }}
                />
              </label>
              <button
                type="button"
                class={h.round}
                aria-label={`Quitar ${x.alimento.name}`}
                onClick={() => setPartes((ps) => ps.filter((_, k) => k !== i))}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label class={`${h.search} ${p.onCard}`}>
        <SearchIcon />
        <input
          type="search"
          value={texto}
          placeholder="Añadir un ingrediente…"
          aria-label="Buscar un ingrediente del plato"
          onInput={(e) => setTexto(e.currentTarget.value)}
        />
      </label>
      {lista.length > 0 && (
        <ul class={h.list}>
          {lista.map((a) => (
            <li key={a.id} class={h.row}>
              <button
                type="button"
                class={h.rowMain}
                onClick={() => {
                  setPartes((ps) => [...ps, { alimento: a, gramos: String(a.servingG) }])
                  setTexto('')
                }}
              >
                <span class={h.rowTitle}>{a.name}</span>
                <span class={h.rowDetail}>Por 100 g: {formatInt(a.kcal)} kcal</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div class={h.fields}>
        <label class={h.field}>
          Peso cocinado (g, sin la olla)
          <input inputMode="decimal" value={cocinado} onInput={(e) => setCocinado(e.currentTarget.value)} />
        </label>
        <label class={h.field}>
          Tu ración (g, si quieres)
          <input inputMode="decimal" value={racion} onInput={(e) => setRacion(e.currentTarget.value)} />
        </label>
      </div>
      {partes.length > 0 && (
        <p class={p.foot}>
          En crudo: {formatInt(calculo.crudo)} g · {formatInt(calculo.total.kcal)} kcal y{' '}
          {formatDecimal(calculo.total.protein)} g de proteína en total.
        </p>
      )}
      {calculo.por100 && (
        <div class={h.tiles}>
          {[
            [formatInt(calculo.por100.kcal), 'kcal'],
            [formatDecimal(calculo.por100.protein), 'proteína'],
            [formatDecimal(calculo.por100.carbs), 'hidratos'],
            [formatDecimal(calculo.por100.fat), 'grasa'],
          ].map(([v, l]) => (
            <div key={l} class={h.tile}>
              <span class={h.tileValue}>{v}</span>
              <span class={h.foot}>{l} / 100 g</span>
            </div>
          ))}
        </div>
      )}
      <Button
        disabled={!calculo.por100}
        onClick={async () => {
          if (!calculo.por100) return
          const a = await guardarPlato(nombre, calculo.por100, parseDecimal(racion))
          avisar(`${a.name}: guardado en Mis alimentos`)
          setPartes([])
          setNombre('')
          setCocinado('')
          setRacion('')
        }}
      >
        Guardar en Mis alimentos
      </Button>
    </section>
  )
}
