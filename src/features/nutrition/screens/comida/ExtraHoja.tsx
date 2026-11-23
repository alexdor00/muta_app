import { useEffect, useState } from 'preact/hooks'
import { formatInt, parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { MinusIcon, PlusIcon, SearchIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { COMIDAS, macrosDe, pasoDe, type Alimento, type ComidaId } from '../../state/comida.ts'
import { PlatoFoto } from '../../components/Platos.tsx'
import { buscarPlatos, fotos, platos, totalDePlato, type ExtraMenu } from '../../state/recetas.ts'
import { buscar, cargarAlimentos, sugeridos, textoRacion } from '../../use-cases/foodLog.ts'
import h from '../comun/Hojas.module.css'
import a from './Anadir.module.css'
import { CifrasRacion } from './CifrasRacion.tsx'
import r from './Racion.module.css'

/**
 * Algo más en una comida de un menú (usuario, 2026-11-17: una fruta, un yogur… además del plato): buscas el alimento y
 * eliges los gramos. Va en el menú todos los días que lleva ese menú.
 */
export function ExtraHoja(props: {
  comida: ComidaId
  menu: string
  onAnadir: (comida: ComidaId, x: ExtraMenu) => void
  onClose: () => void
}) {
  const [comida, setComida] = useState<ComidaId>(props.comida)
  const [texto, setTexto] = useState('')
  const [elegido, setElegido] = useState<Alimento | null>(null)
  const [gramos, setGramos] = useState(0)
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const al = COMIDAS.find((c) => c.id === comida)?.al ?? comida
  const q = texto.trim()
  const lista = (q ? buscar(q) : sugeridos().alimentos).slice(0, 20)
  const recetas = q ? buscarPlatos(platos.value, q).slice(0, 8) : []

  if (elegido) {
    const m = macrosDe(elegido, gramos)
    const paso = pasoDe('gramos')
    return (
      <Sheet
        title={elegido.name}
        onClose={props.onClose}
        atras={{ label: 'Buscar otro', onClick: () => setElegido(null) }}
        footer={
          <div class={h.actions}>
            <Button
              disabled={gramos <= 0}
              onClick={() =>
                props.onAnadir(comida, {
                  alimentoId: elegido.id,
                  nombre: elegido.name,
                  categoria: elegido.category,
                  gramos,
                  kcal: elegido.kcal,
                  protein: elegido.protein,
                  carbs: elegido.carbs,
                  fat: elegido.fat,
                })
              }
            >
              Añadir {al} · {formatInt(m.kcal)} kcal
            </Button>
          </div>
        }
      >
        <div class={a.hoja}>
          <section class={r.tarjeta} aria-label="Cantidad">
            <div class={r.paso}>
              <button
                type="button"
                class={r.redondo}
                aria-label="Menos"
                onClick={() => setGramos((g) => Math.max(0, g - paso))}
              >
                <MinusIcon />
              </button>
              <label class={r.cifra}>
                <input
                  inputMode="numeric"
                  aria-label="Gramos"
                  value={gramos}
                  onInput={(e) =>
                    setGramos(Math.max(0, Math.round(parseDecimal(e.currentTarget.value) || 0)))
                  }
                />
                <span>g</span>
              </label>
              <button
                type="button"
                class={r.redondo}
                aria-label="Más"
                onClick={() => setGramos((g) => g + paso)}
              >
                <PlusIcon />
              </button>
            </div>
            <div class={r.atajos} role="group" aria-label="Cantidades rápidas">
              <button
                type="button"
                class={`${a.pastilla} ${gramos === elegido.servingG ? a.on : ''}`}
                aria-pressed={gramos === elegido.servingG}
                onClick={() => setGramos(elegido.servingG)}
              >
                {textoRacion(elegido)}
              </button>
            </div>
          </section>
          <CifrasRacion m={m} />
          <p class={r.despues}>Va en el {props.menu} todos sus días.</p>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="Algo más en tu menú" onClose={props.onClose} large>
      <div class={a.hoja}>
        <div class={a.pastillas} role="group" aria-label="Comida">
          {COMIDAS.map((c) => (
            <button
              key={c.id}
              type="button"
              class={`${a.pastilla} ${c.id === comida ? a.on : ''}`}
              aria-pressed={c.id === comida}
              onClick={() => setComida(c.id)}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <label class={a.buscador}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Un plato, una fruta, un café…"
            aria-label="Buscar un plato o un alimento"
            enterKeyHint="search"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
        {recetas.length > 0 && (
          <ul class={a.tarjeta} aria-label="Recetas">
            {recetas.map((p) => {
              const t = totalDePlato(p)
              return (
                <li key={p.id} class={a.fila}>
                  <PlatoFoto foto={fotos.value[p.id] ?? null} />
                  <button
                    type="button"
                    class={a.filaTexto}
                    onClick={() =>
                      props.onAnadir(comida, {
                        alimentoId: null,
                        platoId: p.id,
                        nombre: p.nombre,
                        categoria: p.categoria,
                        gramos: 0,
                        kcal: Math.round(t.kcal),
                        protein: t.protein,
                        carbs: t.carbs,
                        fat: t.fat,
                      })
                    }
                  >
                    <span class={a.nombre}>{p.nombre}</span>
                    <span class={a.detalle}>1 ración · {formatInt(t.kcal)} kcal</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {lista.length > 0 && (
          <ul class={a.tarjeta}>
            {lista.map((x) => (
              <li key={x.id} class={a.fila}>
                <button
                  type="button"
                  class={a.filaTexto}
                  onClick={() => {
                    setElegido(x)
                    setGramos(x.servingG)
                  }}
                >
                  <span class={a.nombre}>{x.name}</span>
                  <span class={a.detalle}>
                    {textoRacion(x)} · {formatInt(macrosDe(x, x.servingG).kcal)} kcal
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  )
}
