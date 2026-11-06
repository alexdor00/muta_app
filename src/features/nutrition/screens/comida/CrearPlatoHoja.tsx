import { useEffect, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { PlusIcon, SearchIcon, TrashIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import type { Alimento, Macros } from '../../state/comida.ts'
import { buscar, cargarAlimentos } from '../../use-cases/foodLog.ts'
import { crearPlato } from '../../use-cases/recipes.ts'
import { macrosCortos } from '../comun/platos.ts'
import h from '../comun/Hojas.module.css'

type Props = { onClose: () => void; onCreado: (id: string) => void }

const de = (a: Alimento, g: number): Macros => ({
  kcal: (a.kcal * g) / 100,
  protein: (a.protein * g) / 100,
  carbs: (a.carbs * g) / 100,
  fat: (a.fat * g) / 100,
})

/** Un plato tuyo: su nombre y sus ingredientes con sus gramos (de la base, tus alimentos o lo escaneado). */
export function CrearPlatoHoja({ onClose, onCreado }: Props) {
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const [nombre, setNombre] = useState('')
  const [texto, setTexto] = useState('')
  const [lista, setLista] = useState<{ alimento: Alimento; gramos: number }[]>([])
  const encontrados = texto.trim() ? buscar(texto).slice(0, 8) : []
  const total = lista
    .map((i) => de(i.alimento, i.gramos))
    .reduce(
      (t, m) => ({
        kcal: t.kcal + m.kcal,
        protein: t.protein + m.protein,
        carbs: t.carbs + m.carbs,
        fat: t.fat + m.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    )
  return (
    <Sheet
      title="Crear plato"
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            disabled={!nombre.trim() || !lista.length}
            onClick={async () => {
              const id = await crearPlato(nombre, lista)
              if (id) onCreado(id)
            }}
          >
            Guardar plato
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        <label class={h.field}>
          <span class={h.foot}>Nombre</span>
          <input
            type="text"
            value={nombre}
            placeholder="Mi avena de siempre"
            onInput={(e) => setNombre(e.currentTarget.value)}
          />
        </label>
        {lista.length > 0 && (
          <ul class={h.list}>
            {lista.map((i, k) => (
              <li key={i.alimento.id} class={h.row}>
                <span class={h.rowMain}>
                  <span class={h.rowTitle}>{i.alimento.name}</span>
                  <span class={h.rowDetail}>{formatInt(de(i.alimento, i.gramos).kcal)} kcal</span>
                </span>
                <label class={h.miniStepper}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={i.gramos}
                    aria-label={`Gramos de ${i.alimento.name}`}
                    onInput={(e) => {
                      const g = Math.max(0, Number(e.currentTarget.value) || 0)
                      setLista(lista.map((x, j) => (j === k ? { ...x, gramos: g } : x)))
                    }}
                  />
                  <span>g</span>
                </label>
                <button
                  type="button"
                  class={h.round}
                  aria-label={`Quitar ${i.alimento.name}`}
                  onClick={() => setLista(lista.filter((_, j) => j !== k))}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        {lista.length > 0 && <p class={h.sub}>{macrosCortos(total)}</p>}
        <label class={h.search}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Añadir ingrediente: arroz, pollo…"
            aria-label="Buscar un ingrediente"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
        {encontrados.length > 0 && (
          <ul class={h.list}>
            {encontrados.map((a) => (
              <li key={a.id} class={h.row}>
                <span class={h.rowMain}>
                  <span class={h.rowTitle}>{a.name}</span>
                  <span class={h.rowDetail}>{formatInt(a.kcal)} kcal por 100 g</span>
                </span>
                <button
                  type="button"
                  class={h.round}
                  aria-label={`Añadir ${a.name}`}
                  onClick={() => {
                    if (!lista.some((x) => x.alimento.id === a.id))
                      setLista([...lista, { alimento: a, gramos: a.servingG || 100 }])
                    setTexto('')
                  }}
                >
                  <PlusIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  )
}
