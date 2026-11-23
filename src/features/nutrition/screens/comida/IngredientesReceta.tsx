import { useState } from 'preact/hooks'
import { formatDecimal, parseDecimal } from '../../../../shared/lib/format.ts'
import { Deslizable } from '../../../../shared/ui/Deslizable.tsx'
import { BarcodeIcon, PlusIcon, SearchIcon } from '../../../../shared/ui/icons.tsx'
import { nombreRacion, unidadDe, type Alimento, type Modo } from '../../state/comida.ts'
import { buscar } from '../../use-cases/foodLog.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import s from './CrearPlato.module.css'
import { EscanerHoja } from './EscanerHoja.tsx'

/** Un ingrediente de tu receta: el alimento, cuánto y si va en gramos o en sus unidades («2 huevos»). */
export type IngredienteNuevo = { alimento: Alimento; cantidad: number; modo: Modo }

/** Sus gramos (lo que guarda la receta): las unidades, por el peso de cada una. */
export const gramosDeIngrediente = (i: IngredienteNuevo) =>
  i.modo === 'racion' ? Math.round(i.cantidad * i.alimento.servingG) : i.cantidad

/** Lo que va en gramos de serie: los que se pesan (ración de 100 g) o dicen sus gramos. */
const nuevo = (a: Alimento): IngredienteNuevo =>
  a.servingG === 100 || /^\d/.test(a.servingLabel)
    ? { alimento: a, cantidad: 100, modo: 'gramos' }
    : { alimento: a, cantidad: 1, modo: 'racion' }

/**
 * Los ingredientes de tu receta (usuario, 2026-11-21): buscar en la base o escanear; cada uno en gramos (ml si se bebe) o
 * en sus unidades, y deslizar lo quita.
 */
export function IngredientesReceta(props: {
  lista: IngredienteNuevo[]
  onCambio: (lista: IngredienteNuevo[]) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}) {
  const { lista, onCambio } = props
  const [texto, setTexto] = useState('')
  const [escaneando, setEscaneando] = useState(false)
  const encontrados = texto.trim() ? buscar(texto).slice(0, 6) : []
  const poner = (k: number, x: Partial<IngredienteNuevo>) =>
    onCambio(lista.map((y, j) => (j === k ? { ...y, ...x } : y)))
  if (escaneando)
    return (
      <EscanerHoja
        comida="comida"
        onClose={() => setEscaneando(false)}
        onElegir={(a) => {
          onCambio([...lista, nuevo(a)])
          setEscaneando(false)
        }}
        avisar={props.avisar}
      />
    )
  return (
    <section class={s.tarjeta} aria-label="Ingredientes">
      <ul class={s.lista}>
        {lista.map((i, k) => {
          const u = unidadDe(i.alimento)
          const enUnidades = i.modo === 'racion'
          return (
            <li key={`${i.alimento.id}-${k}`}>
              <Deslizable
                fondo="surface"
                plano
                ariaLabel={`Quitar ${i.alimento.name}`}
                onQuitar={() => onCambio(lista.filter((_, j) => j !== k))}
              >
                <div class={s.fila}>
                  <span class={s.filaNombre}>{i.alimento.name}</span>
                  <span class={s.gramos}>
                    <input
                      inputMode="decimal"
                      aria-label={`Cantidad de ${i.alimento.name}`}
                      value={formatDecimal(i.cantidad)}
                      onInput={(e) => poner(k, { cantidad: parseDecimal(e.currentTarget.value) ?? 0 })}
                    />
                    <select
                      class={s.unidad}
                      aria-label={`Unidad de ${i.alimento.name}`}
                      value={i.modo}
                      onChange={(e) => {
                        const m = e.currentTarget.value === 'racion' ? 'racion' : 'gramos'
                        const g = gramosDeIngrediente(i)
                        poner(k, {
                          modo: m,
                          cantidad: m === 'racion' ? Math.max(1, Math.round(g / i.alimento.servingG)) : g,
                        })
                      }}
                    >
                      <option value="gramos">{u}</option>
                      <option value="racion">
                        {nombreRacion(i.alimento, enUnidades ? i.cantidad : 2).replace(/^[^ ]+ /, '')}
                      </option>
                    </select>
                  </span>
                </div>
              </Deslizable>
            </li>
          )
        })}
      </ul>
      <div class={s.buscarFila}>
        <label class={`${h.search} ${s.buscar}`}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Añadir ingrediente: arroz, pollo…"
            aria-label="Buscar un ingrediente"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
        <button
          type="button"
          class={s.escanear}
          aria-label="Escanear un ingrediente"
          onClick={() => setEscaneando(true)}
        >
          <BarcodeIcon />
        </button>
      </div>
      {encontrados.length > 0 && (
        <ul class={s.lista}>
          {encontrados.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                class={s.fila}
                onClick={() => {
                  onCambio([...lista, nuevo(a)])
                  setTexto('')
                }}
              >
                <span class={s.filaNombre}>{a.name}</span>
                <PlusIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
