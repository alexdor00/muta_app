import { useEffect, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { SearchIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { alimentoPorId, hoy, propios, type Alimento } from '../../state/comida.ts'
import { cambioDe, MACROS, platoOriginal, type Plato } from '../../state/recetas.ts'
import { buscar, cargarAlimentos } from '../../use-cases/foodLog.ts'
import { cambiarIngrediente, equivalentes } from '../../use-cases/recipes.ts'
import { CrearAlimentoHoja } from '../comida/CrearAlimentoHoja.tsx'
import { EscanerHoja } from '../comida/EscanerHoja.tsx'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import styles from './Plato.module.css'

type Props = {
  plato: Plato
  indice: number
  fecha: string
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

type Opcion = { id: string; nombre: string; gramos: number; kcal: number }
type Donde = 'todos' | 'plato' | 'hoy'

const signo = (n: number) => (n > 0 ? `+${formatInt(n)}` : n < 0 ? `−${formatInt(-n)}` : '±0')

/**
 * Cambiar un ingrediente: por otra marca (la tuya, escaneada o de su etiqueta; mismos gramos) o por otro alimento que
 * haga lo mismo (los mismos gramos de su macro principal), con cuánto cambian las kcal.
 */
export function CambiarHoja({ plato, indice, fecha, onClose, avisar }: Props) {
  const original = platoOriginal(plato.id) ?? plato
  const i = original.ingredientes[indice]
  const actual = cambioDe(original, indice, fecha)
  const [modo, setModo] = useState<'marca' | 'alimento'>(actual?.gramos ? 'alimento' : 'marca')
  const [elegido, setElegido] = useState<Opcion | null>(null)
  const [donde, setDonde] = useState<Donde>(actual?.gramos ? 'hoy' : 'todos')
  const [texto, setTexto] = useState('')
  const [paso, setPaso] = useState<'elegir' | 'escanear' | 'crear'>('elegir')
  const [lista, setLista] = useState<Opcion[] | null>(null)
  const [base, setBase] = useState(false)
  useEffect(() => {
    void cargarAlimentos().then(() => setBase(true))
    void equivalentes(i).then((r) =>
      setLista(
        r
          ? r.lista.map((x) => ({
              id: x.alimento.id,
              nombre: x.alimento.name,
              gramos: x.gramos,
              kcal: x.kcal,
            }))
          : [],
      ),
    )
  }, [i])
  if (!i?.por100 || i.gramos === null) return null
  const g0 = i.gramos
  const kcal0 = Math.round((i.por100.kcal * g0) / 100)
  const macro = MACROS.find((m) => m.id === i.macro) ?? MACROS[1]
  const cantidad = (i.por100[macro.id] * g0) / 100
  const deMarca = (a: Alimento): Opcion => ({
    id: a.id,
    nombre: a.name,
    gramos: g0,
    kcal: Math.round((a.kcal * g0) / 100),
  })
  const equivalente = (a: Alimento): Opcion[] => {
    if (!(a[macro.id] > 0)) return []
    const g = Math.round((cantidad / a[macro.id]) * 20) * 5
    return [{ id: a.id, nombre: a.name, gramos: g, kcal: Math.round((a.kcal * g) / 100) }]
  }
  if (paso === 'escanear')
    return (
      <EscanerHoja
        comida="comida"
        onClose={() => setPaso('elegir')}
        onElegir={(a) => {
          setElegido(deMarca(a))
          setPaso('elegir')
        }}
        avisar={avisar}
      />
    )
  if (paso === 'crear')
    return (
      <CrearAlimentoHoja
        onClose={() => setPaso('elegir')}
        onCreado={(a) => {
          setElegido(deMarca(a))
          setPaso('elegir')
        }}
      />
    )
  const opciones: Opcion[] =
    modo === 'marca'
      ? [
          ...propios.value.map(deMarca),
          ...(elegido && !propios.value.some((a) => a.id === elegido.id) ? [elegido] : []),
        ]
      : texto.trim() && base
        ? buscar(texto).slice(0, 8).flatMap(equivalente)
        : (lista ?? [])
  const cambiar = async () => {
    if (!elegido) return
    await cambiarIngrediente(
      original,
      indice,
      { alimentoId: elegido.id, gramos: modo === 'marca' ? null : elegido.gramos },
      donde,
      hoy.value,
    )
    onClose()
    avisar(`${i.nombre} → ${elegido.nombre}`, {
      label: 'Deshacer',
      onClick: () =>
        void cambiarIngrediente(original, indice, actual, actual?.fecha ? 'hoy' : 'plato', hoy.value),
    })
  }
  const ahora = actual ? alimentoPorId(actual.alimentoId) : null
  return (
    <Sheet
      title={i.nombre}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button disabled={!elegido} onClick={() => void cambiar()}>
            Cambiar
          </Button>
          {actual && (
            <button
              type="button"
              class={h.textButton}
              onClick={async () => {
                await cambiarIngrediente(original, indice, null, 'todos', hoy.value)
                onClose()
                avisar(`Vuelve ${i.nombre.toLowerCase()}`)
              }}
            >
              Volver a {i.nombre.toLowerCase()}
              {ahora ? ` (ahora: ${ahora.name.toLowerCase()})` : ''}
            </button>
          )}
        </div>
      }
    >
      <div class={h.stack}>
        <ChoiceSegmented<'marca' | 'alimento'>
          name="cambiar-modo"
          legend="Cambiar por"
          options={[
            { value: 'marca', label: 'Otra marca' },
            { value: 'alimento', label: 'Otro alimento' },
          ]}
          value={modo}
          onChange={(x) => {
            setModo(x)
            setElegido(null)
            setDonde(x === 'marca' ? 'todos' : 'hoy')
          }}
        />
        {modo === 'alimento' ? (
          <>
            <p class={h.sub}>
              En lugar de {formatInt(g0)} g, lo mismo de {macro.nombre.toLowerCase()} ({formatInt(cantidad)}{' '}
              g) con:
            </p>
            <label class={h.search}>
              <SearchIcon />
              <input
                type="search"
                value={texto}
                placeholder="Otro alimento"
                aria-label="Buscar otro alimento"
                onInput={(e) => setTexto(e.currentTarget.value)}
              />
            </label>
          </>
        ) : (
          <p class={h.sub}>La tuya, con los mismos {formatInt(g0)} g: escanéala o escribe su etiqueta.</p>
        )}
        {opciones.length > 0 && (
          <ul class={h.list}>
            {opciones.map((o) => (
              <li key={o.id}>
                <label class={styles.opcion}>
                  <input
                    type="radio"
                    name="cambiar-por"
                    checked={elegido?.id === o.id}
                    onChange={() => setElegido(o)}
                  />
                  <span class={styles.opcionNombre}>{o.nombre}</span>
                  <b>{formatInt(o.gramos)} g</b>
                  <span class={styles.opcionKcal}>{signo(o.kcal - kcal0)} kcal</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {modo === 'alimento' && lista === null && <p class={h.foot}>Buscando equivalentes…</p>}
        {modo === 'marca' && (
          <div class={h.searchRow}>
            <Button variant="secondary" onClick={() => setPaso('escanear')}>
              Escanear
            </Button>
            <Button variant="secondary" onClick={() => setPaso('crear')}>
              Escribir su etiqueta
            </Button>
          </div>
        )}
        <ChoiceSegmented<Donde>
          name="cambiar-donde"
          legend="Dónde"
          options={
            modo === 'marca'
              ? [
                  { value: 'todos', label: 'En todos tus platos' },
                  { value: 'plato', label: 'Solo en este' },
                ]
              : [
                  { value: 'hoy', label: 'Solo hoy' },
                  { value: 'plato', label: 'Siempre en este plato' },
                ]
          }
          value={donde}
          onChange={setDonde}
        />
      </div>
    </Sheet>
  )
}
