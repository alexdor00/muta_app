import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { PlusIcon, SearchIcon, TrashIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import type { Alimento } from '../../state/comida.ts'
import { platoOriginal, type IngredientePlato, type Plato } from '../../state/recetas.ts'
import { buscar, cargarAlimentos } from '../../use-cases/foodLog.ts'
import { guardarTuVersion, ingredienteNuevo } from '../../use-cases/recipes.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'

type Props = { plato: Plato; onClose: () => void; avisar: (texto: string, accion?: Aviso['accion']) => void }

/**
 * Editar un plato: su nombre, los gramos de cada ingrediente (para siempre), quitar o añadir ingredientes y sus pasos. Un
 * plato del recetario no se toca: se guarda como tuyo.
 */
export function EditarPlatoHoja({ plato, onClose, avisar }: Props) {
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const { route } = useLocation()
  const original = platoOriginal(plato.id) ?? plato
  const [nombre, setNombre] = useState(original.nombre)
  const [gramos, setGramos] = useState<(number | null)[]>(original.ingredientes.map((i) => i.gramos))
  const [quitar, setQuitar] = useState<number[]>([])
  const [anadir, setAnadir] = useState<IngredientePlato[]>([])
  const [pasos, setPasos] = useState(original.pasos.join('\n'))
  const [texto, setTexto] = useState('')
  const encontrados = texto.trim() ? buscar(texto).slice(0, 6) : []
  const tuyo = original.origen === 'tuyo'
  const fila = (
    nombreI: string,
    g: number | null,
    cambiar: (g: number) => void,
    borrar: () => void,
    key: string,
  ) => (
    <li key={key} class={h.row}>
      <span class={h.rowMain}>
        <span class={h.rowTitle}>{nombreI}</span>
      </span>
      {g !== null && (
        <label class={h.miniStepper}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={g}
            aria-label={`Gramos de ${nombreI}`}
            onInput={(e) => cambiar(Math.max(0, Number(e.currentTarget.value) || 0))}
          />
          <span>g</span>
        </label>
      )}
      <button type="button" class={h.round} aria-label={`Quitar ${nombreI}`} onClick={borrar}>
        <TrashIcon />
      </button>
    </li>
  )
  return (
    <Sheet
      title={tuyo ? 'Editar plato' : 'Tu versión'}
      onClose={onClose}
      large
      footer={
        <div class={h.actions}>
          <Button
            onClick={async () => {
              const id = await guardarTuVersion(original, {
                nombre,
                gramos,
                quitar,
                anadir,
                pasos: pasos
                  .split('\n')
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
              // Si es nuevo, se va a él (la hoja se cierra sola al cambiar de pantalla)
              if (id !== plato.id) return route(paths.dish(id), true)
              onClose()
              avisar('Plato guardado')
            }}
          >
            Guardar
          </Button>
        </div>
      }
    >
      <div class={h.stack}>
        {!tuyo && (
          <p class={h.sub}>El del recetario se queda como está; esto se guarda como un plato tuyo.</p>
        )}
        <label class={h.field}>
          <span class={h.foot}>Nombre</span>
          <input type="text" value={nombre} onInput={(e) => setNombre(e.currentTarget.value)} />
        </label>
        <ul class={h.list}>
          {original.ingredientes.map((i, k) =>
            quitar.includes(k) || !i.cuenta
              ? null
              : fila(
                  i.alimentoId ? i.nombre : i.texto,
                  gramos[k],
                  (g) => setGramos(gramos.map((x, j) => (j === k ? g : x))),
                  () => setQuitar([...quitar, k]),
                  `o-${k}`,
                ),
          )}
          {anadir.map((i, k) =>
            fila(
              i.nombre,
              i.gramos,
              (g) => setAnadir(anadir.map((x, j) => (j === k ? { ...x, gramos: g } : x))),
              () => setAnadir(anadir.filter((_, j) => j !== k)),
              `n-${k}`,
            ),
          )}
        </ul>
        <label class={h.search}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Añadir ingrediente"
            aria-label="Buscar un ingrediente para añadir"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
        {encontrados.length > 0 && (
          <ul class={h.list}>
            {encontrados.map((a: Alimento) => (
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
                    setAnadir([...anadir, ingredienteNuevo(a, a.servingG || 100)])
                    setTexto('')
                  }}
                >
                  <PlusIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label class={h.field}>
          <span class={h.foot}>Preparación (un paso por línea)</span>
          <textarea
            class={h.textarea}
            rows={5}
            value={pasos}
            onInput={(e) => setPasos(e.currentTarget.value)}
          />
        </label>
      </div>
    </Sheet>
  )
}
