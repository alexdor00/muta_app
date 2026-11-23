import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronDownIcon, SearchIcon } from '../../../../shared/ui/icons.tsx'
import { estado } from '../../state/comida.ts'
import { filtrosPuestos, recetasCon } from '../../state/filtroRecetas.ts'
import {
  buscarPlatos,
  categorias,
  platos,
  recetasGuardadas,
  estadoRecetas,
  FILTRO_RECETAS,
  siguiente,
  type FiltroRecetas,
} from '../../state/recetas.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { Barra } from '../comun/Barra.tsx'
import p from '../comun/Pagina.module.css'
import a from '../comida/Anadir.module.css'
import { FiltrosHoja } from './FiltrosHoja.tsx'
import { RecetaFila } from './RecetaFila.tsx'
import s from './Recetas.module.css'

/**
 * Los platos de una categoría (rediseño, pantallas 28 y 29; usuario, 2026-11-17): «‹ Carne» con su lupa, el orden (abre
 * filtrar y ordenar) y los filtros rápidos en pastillas, y la lista con su marcador.
 */
export function CategoriaScreen(props: { categoria: string }) {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  const [filtro, setFiltro] = useState<FiltroRecetas>(FILTRO_RECETAS)
  const [filtrar, setFiltrar] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [texto, setTexto] = useState('')
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  // Tus guardadas, como una categoría más (usuario, 2026-11-21: «‹» vuelve a Recetas)
  const guardadas = props.categoria === 'guardadas'
  const c = guardadas
    ? {
        id: 'guardadas',
        nombre: 'Guardadas',
        platos: platos.value.filter((x) => recetasGuardadas.value.includes(x.id)),
      }
    : categorias.value.find((x) => x.id === props.categoria)
  const volver = `${paths.nutrition}?vista=recetas`
  if (!c) {
    return (
      <div class={p.page}>
        <Barra titulo="Recetas" volver={volver} />
        <p class={s.vacio}>Esta categoría no tiene recetas.</p>
      </div>
    )
  }
  const base = texto.trim() ? buscarPlatos(c.platos, texto) : c.platos
  const lista = recetasCon(base, filtro)
  const s0 = siguiente.value
  const puestos = filtrosPuestos(filtro)
  return (
    <div class={p.page}>
      <Barra
        titulo={c.nombre}
        volver={volver}
        accion={
          <button
            type="button"
            class={s.marcador}
            aria-label="Buscar en esta categoría"
            aria-pressed={buscando}
            onClick={() => setBuscando(!buscando)}
          >
            <SearchIcon />
          </button>
        }
      />
      {buscando && (
        <label class={a.buscador}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder={`Busca en ${c.nombre.toLowerCase()}`}
            aria-label={`Buscar en ${c.nombre}`}
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
      )}
      {/* Un solo botón (usuario, 2026-11-21): la hoja tiene orden, tiempo y dificultad; con pocas recetas, ni eso */}
      {c.platos.length >= 8 && (
        <div class={s.filtros}>
          <button
            type="button"
            class={`${a.pastilla} ${puestos ? a.on : ''}`}
            onClick={() => setFiltrar(true)}
          >
            Ordenar y filtrar{puestos ? ` · ${puestos}` : ''} <ChevronDownIcon />
          </button>
        </div>
      )}
      {lista.length ? (
        <ul class={s.lista}>
          {lista.map((x) => (
            <RecetaFila
              key={x.id}
              plato={x}
              comida={filtro.orden === 'falta' && s0 ? s0.comida : undefined}
            />
          ))}
        </ul>
      ) : (
        <p class={s.vacio}>
          {guardadas && !c.platos.length
            ? 'Aún no has guardado ninguna: toca la estrella de una receta.'
            : 'Ninguna con este filtro.'}
        </p>
      )}
      {filtrar && (
        <FiltrosHoja platos={base} filtro={filtro} onAplicar={setFiltro} onClose={() => setFiltrar(false)} />
      )}
    </div>
  )
}
