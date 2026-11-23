import { useEffect, useState } from 'preact/hooks'
import { formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import {
  BarcodeIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  SwapIcon,
  TrashIcon,
} from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { alimentoPorId, propios, type Alimento } from '../../state/comida.ts'
import { cambioDe, MACROS, platoOriginal, type Plato } from '../../state/recetas.ts'
import { buscar, cargarAlimentos } from '../../use-cases/foodLog.ts'
import { cambiarIngrediente, equivalentes } from '../../use-cases/recipes.ts'
import { CrearAlimentoHoja } from '../comida/CrearAlimentoHoja.tsx'
import { EscanerHoja } from '../comida/EscanerHoja.tsx'
import p from '../comida/PlanHojas.module.css'
import r from '../comida/Racion.module.css'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import s from './Apuntar.module.css'
import styles from './Plato.module.css'

type Props = {
  plato: Plato
  indice: number
  fecha: string
  /** Al apuntar un día (`dia`): de serie, solo ese día. Sin él, en la receta (para siempre). */
  contexto?: 'dia' | 'menu'
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

type Opcion = { id: string; nombre: string; gramos: number; kcal: number }
type Donde = 'plato' | 'hoy'

const signo = (n: number) => (n > 0 ? `+${formatInt(n)}` : n < 0 ? `−${formatInt(-n)}` : '±0')

/**
 * Tocar un ingrediente (usuario, 2026-11-21; `Desktop/MUTA-Ingrediente-propuesta.png`): su cantidad arriba (así haces tu
 * versión de la receta, sin otro botón), «Cambiar por» tu marca (escaneada o de su etiqueta; mismos gramos), otro alimento
 * (los mismos gramos de su macro principal) o quitarlo, y dónde: en esta receta (para siempre), en todas tus recetas (tu
 * marca) o solo hoy. Con «Deshacer».
 */
export function CambiarHoja({ plato, indice, fecha, contexto, onClose, avisar }: Props) {
  const original = platoOriginal(plato.id) ?? plato
  const i = original.ingredientes[indice]
  const actual = cambioDe(original, indice, fecha)
  const g0 = i?.gramos ?? 0
  const [gramos, setGramos] = useState<number>(actual?.gramos ?? g0)
  const [escrito, setEscrito] = useState<string | null>(null)
  const [elegido, setElegido] = useState<(Opcion & { marca: boolean }) | null>(null)
  // Sin «Dónde» (usuario, 2026-11-21): cambia la receta para siempre; al apuntar un día, solo ese día
  const donde: Donde = contexto === 'dia' ? 'hoy' : 'plato'
  const [texto, setTexto] = useState('')
  const [paso, setPaso] = useState<'inicio' | 'marca' | 'alimento' | 'escanear' | 'crear'>('inicio')
  const [lista, setLista] = useState<Opcion[] | null>(null)
  const [base, setBase] = useState(false)
  useEffect(() => {
    void cargarAlimentos().then(() => setBase(true))
    void equivalentes(i).then((x) =>
      setLista(
        x
          ? x.lista.map((y) => ({
              id: y.alimento.id,
              nombre: y.alimento.name,
              gramos: y.gramos,
              kcal: y.kcal,
            }))
          : [],
      ),
    )
  }, [i])
  if (!i?.por100 || i.gramos === null || !i.alimentoId) return null
  const macro = MACROS.find((m) => m.id === i.macro) ?? MACROS[1]
  const cantidad = (i.por100[macro.id] * g0) / 100
  const kcal0 = Math.round((i.por100.kcal * g0) / 100)
  const ahora = elegido ? alimentoPorId(elegido.id) : actual ? alimentoPorId(actual.alimentoId) : null
  const kcalAhora = Math.round((((ahora ?? null)?.kcal ?? i.por100.kcal) * gramos) / 100)
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
  const elegir = (o: Opcion, marca: boolean) => {
    setElegido({ ...o, marca })
    if (!marca) setGramos(o.gramos)
    setPaso('inicio')
  }
  const deshacer = {
    label: 'Deshacer',
    onClick: () => void cambiarIngrediente(original, indice, actual, actual?.fecha ? 'hoy' : 'plato', fecha),
  }
  async function guardar(g = gramos) {
    const id = elegido?.id ?? actual?.alimentoId ?? i.alimentoId!
    const igual = id === i.alimentoId && g === g0
    await cambiarIngrediente(original, indice, igual ? null : { alimentoId: id, gramos: g }, donde, fecha)
    onClose()
    avisar(g === 0 ? `Sin ${i.nombre.toLowerCase()}` : 'Guardado', deshacer)
  }

  if (paso === 'escanear')
    return (
      <EscanerHoja
        comida="comida"
        onClose={() => setPaso('marca')}
        onElegir={(a) => elegir(deMarca(a), true)}
        avisar={avisar}
      />
    )
  if (paso === 'crear')
    return <CrearAlimentoHoja onClose={() => setPaso('marca')} onCreado={(a) => elegir(deMarca(a), true)} />
  if (paso === 'marca' || paso === 'alimento') {
    const opciones =
      paso === 'marca'
        ? propios.value.map(deMarca)
        : texto.trim() && base
          ? buscar(texto).slice(0, 8).flatMap(equivalente)
          : (lista ?? [])
    return (
      <Sheet
        title={paso === 'marca' ? 'Cambiar marca' : 'Otro alimento'}
        atras={{ label: i.nombre, onClick: () => setPaso('inicio') }}
        onClose={onClose}
        large
      >
        <div class={h.stack}>
          {paso === 'marca' ? (
            <>
              <p class={h.sub}>La tuya, con los mismos {formatInt(g0)} g.</p>
              <div class={h.searchRow}>
                <Button variant="secondary" onClick={() => setPaso('escanear')}>
                  Escanear
                </Button>
                <Button variant="secondary" onClick={() => setPaso('crear')}>
                  Escribir su etiqueta
                </Button>
              </div>
            </>
          ) : (
            <>
              <p class={h.sub}>
                Lo mismo de {macro.nombre.toLowerCase()} ({formatInt(cantidad)} g) que {formatInt(g0)} g de{' '}
                {i.nombre.toLowerCase()}.
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
              {lista === null && <p class={h.foot}>Buscando equivalentes…</p>}
            </>
          )}
          {opciones.length > 0 && (
            <ul class={h.list}>
              {opciones.map((o) => (
                <li key={o.id}>
                  <button type="button" class={styles.opcion} onClick={() => elegir(o, paso === 'marca')}>
                    <span class={styles.opcionNombre}>{o.nombre}</span>
                    <b>{formatInt(o.gramos)} g</b>
                    <span class={styles.opcionKcal}>{signo(o.kcal - kcal0)} kcal</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Sheet>
    )
  }

  const paso1 = 5
  return (
    <Sheet
      title={ahora && ahora.id !== i.alimentoId ? ahora.name : i.nombre}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button onClick={() => void guardar()}>Guardar</Button>
          {actual && (
            <button
              type="button"
              class={h.textButton}
              onClick={async () => {
                await cambiarIngrediente(original, indice, null, 'todos', fecha)
                onClose()
                avisar(`Como en la receta: ${i.nombre.toLowerCase()}`, deshacer)
              }}
            >
              Volver a la receta ({formatInt(g0)} g de {i.nombre.toLowerCase()})
            </button>
          )}
        </div>
      }
    >
      <div class={s.hoja}>
        <section class={r.tarjeta} aria-label="Cantidad">
          <div class={r.paso}>
            <button
              type="button"
              class={r.redondo}
              aria-label="Menos"
              onClick={() => {
                setGramos((g) => Math.max(0, g - paso1))
                setEscrito(null)
              }}
            >
              <MinusIcon />
            </button>
            <label class={r.cifra}>
              <input
                inputMode="decimal"
                aria-label="Gramos"
                value={escrito ?? formatInt(gramos)}
                onInput={(e) => {
                  setEscrito(e.currentTarget.value)
                  const n = parseDecimal(e.currentTarget.value)
                  setGramos(n !== null && n >= 0 ? Math.round(n) : 0)
                }}
              />
              <span>g</span>
            </label>
            <button
              type="button"
              class={r.redondo}
              aria-label="Más"
              onClick={() => {
                setGramos((g) => g + paso1)
                setEscrito(null)
              }}
            >
              <PlusIcon />
            </button>
          </div>
          <p class={s.nota}>
            La receta lleva {formatInt(g0)} g · ahora, {formatInt(kcalAhora)} kcal
          </p>
        </section>

        <section>
          <h3 class={s.rotulo}>Cambiar por</h3>
          <ul class={p.filas}>
            <li class={p.fila}>
              <button type="button" class={s.opcionFila} onClick={() => setPaso('marca')}>
                <span class={s.icono}>
                  <BarcodeIcon />
                </span>
                <span class={p.que}>
                  Cambiar marca
                  <small>Escanear o escribir etiqueta</small>
                </span>
                <ChevronRightIcon />
              </button>
            </li>
            <li class={p.fila}>
              <button type="button" class={s.opcionFila} onClick={() => setPaso('alimento')}>
                <span class={s.icono}>
                  <SwapIcon />
                </span>
                <span class={p.que}>
                  Otro alimento
                  <small>
                    {macro.id === 'carbs' ? 'Con los mismos' : 'Con la misma'} {macro.nombre.toLowerCase()}
                  </small>
                </span>
                <ChevronRightIcon />
              </button>
            </li>
            <li class={p.fila}>
              <button type="button" class={`${s.opcionFila} ${s.quitar}`} onClick={() => void guardar(0)}>
                <span class={s.icono}>
                  <TrashIcon />
                </span>
                <span class={p.que}>Eliminar de la receta</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </Sheet>
  )
}
