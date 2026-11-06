import { useEffect, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { alimentoPorId, propios, type Alimento, type Macros } from '../../state/comida.ts'
import { productoDe, totalCon, valoresDe, type Plato } from '../../state/recetas.ts'
import { cargarAlimentos } from '../../use-cases/foodLog.ts'
import { usarProducto } from '../../use-cases/recipes.ts'
import { CrearAlimentoHoja } from '../comida/CrearAlimentoHoja.tsx'
import { EscanerHoja } from '../comida/EscanerHoja.tsx'
import { macrosCortos } from '../comun/platos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = {
  plato: Plato
  indice: number
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}

const macrosDe = (a: Alimento): Macros => ({ kcal: a.kcal, protein: a.protein, carbs: a.carbs, fat: a.fat })
const por100 = (m: Macros) => `${macrosCortos(m)} por 100 g`

/**
 * ¿Cuál compras? En un ingrediente, el genérico de la base o el tuyo (escaneado o escrito de su etiqueta): la receta
 * cuenta con sus valores. En todos tus platos o solo en este.
 */
export function ProductoHoja({ plato, indice, onClose, avisar }: Props) {
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const i = plato.ingredientes[indice]
  const [elegido, setElegido] = useState<string | null>(productoDe(plato, indice))
  const [siempre, setSiempre] = useState(true)
  const [paso, setPaso] = useState<'elegir' | 'escanear' | 'crear'>('elegir')
  if (paso === 'escanear')
    return (
      <EscanerHoja
        comida="comida"
        onClose={() => setPaso('elegir')}
        onElegir={(a) => {
          setElegido(a.id)
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
          setElegido(a.id)
          setPaso('elegir')
        }}
      />
    )
  if (!i?.por100 || i.gramos === null) return null
  const tuyos = propios.value
  const valores = valoresDe(plato)
  const gramos = plato.ingredientes.map((x) => x.gramos)
  const elegidoA = elegido ? alimentoPorId(elegido) : null
  const conEse = [...valores]
  conEse[indice] = elegidoA ? macrosDe(elegidoA) : null
  const antes = totalCon(plato, gramos, valores)
  const despues = totalCon(plato, gramos, conEse)
  const opciones = [
    { id: null, nombre: `${i.nombre} · genérico`, detalle: `De la base · ${por100(i.por100)}` },
    ...tuyos.map((a) => ({
      id: a.id,
      nombre: a.name,
      detalle: `${a.codigo ? 'Escaneado' : 'Tuyo'} · ${por100(macrosDe(a))}`,
    })),
  ]

  return (
    <Sheet
      title={`${i.nombre} · ¿cuál compras?`}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              await usarProducto(plato, indice, elegido, siempre)
              onClose()
              avisar(
                elegido
                  ? `Usas el tuyo ${siempre ? 'en todos tus platos' : 'en este plato'}`
                  : 'Vuelve el genérico',
              )
            }}
          >
            {elegido ? 'Usar el tuyo' : 'Usar el genérico'}
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <p class={h.sub}>En este plato van {formatInt(i.gramos)} g.</p>
        <ul class={h.list}>
          {opciones.map((o) => (
            <li key={o.id ?? 'generico'}>
              <label class={h.check}>
                <input
                  type="radio"
                  name="producto"
                  checked={elegido === o.id}
                  onChange={() => setElegido(o.id)}
                />
                <span class={h.rowMain}>
                  <span class={h.rowTitle}>{o.nombre}</span>
                  <span class={h.rowDetail}>{o.detalle}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div class={h.searchRow}>
          <Button variant="secondary" onClick={() => setPaso('escanear')}>
            Escanear
          </Button>
          <Button variant="secondary" onClick={() => setPaso('crear')}>
            Escribir su etiqueta
          </Button>
        </div>
        <section class={h.card} aria-label="La receta con el tuyo">
          <p class={h.eyebrow}>El plato con este</p>
          <p class={h.line}>
            <span>Antes</span>
            <span class={h.foot}>{macrosCortos(antes)}</span>
          </p>
          <p class={h.line}>
            <span>Ahora</span>
            <b>{macrosCortos(despues)}</b>
          </p>
          {plato.ajustable && Math.abs(despues.kcal - antes.kcal) >= 30 && (
            <p class={h.foot}>Al ajustar el plato a lo que te falta ya cuenta con estos valores.</p>
          )}
        </section>
        {elegido && i.alimentoId && (
          <ChoiceSegmented<'si' | 'no'>
            name="producto-donde"
            legend="Dónde"
            options={[
              { value: 'si', label: 'En todos tus platos' },
              { value: 'no', label: 'Solo en este' },
            ]}
            value={siempre ? 'si' : 'no'}
            onChange={(v) => setSiempre(v === 'si')}
          />
        )}
      </div>
    </Sheet>
  )
}
