import { useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { BookmarkIcon, PlusIcon, SearchIcon, SlidersIcon } from '../../../../shared/ui/icons.tsx'
import { filtrosPuestos, recetasCon } from '../../state/filtroRecetas.ts'
import {
  buscarPlatos,
  categorias,
  estadoRecetas,
  FILTRO_RECETAS,
  fotos,
  platos,
  type FiltroRecetas,
} from '../../state/recetas.ts'
import a from './Anadir.module.css'
import { FiltrosHoja } from '../plato/FiltrosHoja.tsx'
import { RecetaFila } from '../plato/RecetaFila.tsx'
import s from '../plato/Recetas.module.css'

/**
 * Recetas (rediseño, pantalla 27; usuario, 2026-11-17): buscar con su filtro, las categorías con su foto y tus guardadas
 * (sin «Para ti hoy»: usuario, 2026-11-19). Con búsqueda o filtro, la lista.
 */
export function RecetasVista({ onCrear }: { onCrear?: () => void }) {
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState<FiltroRecetas | null>(null)
  const [filtrar, setFiltrar] = useState(false)
  if (estadoRecetas.value !== 'listo') return null
  const q = texto.trim()
  const base = q ? buscarPlatos(platos.value, q) : platos.value
  const lista = q || filtro ? recetasCon(base, filtro ?? FILTRO_RECETAS).slice(0, 60) : null
  const puestos = filtro ? filtrosPuestos(filtro) : 0

  return (
    <div class={s.vista}>
      <div class={s.buscar}>
        <label class={a.buscador}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Busca una receta o un ingrediente"
            aria-label="Buscar una receta o un ingrediente"
            enterKeyHint="search"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
        <button
          type="button"
          class={s.redondo}
          aria-label={puestos ? `Filtrar y ordenar (${puestos})` : 'Filtrar y ordenar'}
          onClick={() => setFiltrar(true)}
        >
          <SlidersIcon />
          {puestos > 0 && <span class={s.puestos}>{puestos}</span>}
        </button>
      </div>

      {lista ? (
        <>
          {filtro && (
            <button type="button" class={s.enlace} onClick={() => setFiltro(null)}>
              Quitar el filtro
            </button>
          )}
          {lista.length ? (
            <ul class={s.lista}>
              {lista.map((p) => (
                <RecetaFila key={p.id} plato={p} />
              ))}
            </ul>
          ) : (
            <p class={s.vacio}>
              {q ? `Ninguna receta lleva «${q}» con este filtro.` : 'Ninguna con este filtro.'}
            </p>
          )}
        </>
      ) : (
        <>
          <section class={s.seccion} aria-labelledby="categorias">
            <div class={s.cabeza}>
              <h2 id="categorias">Categorías</h2>
              <a class={s.enlace} href={paths.dishes('guardadas')}>
                <BookmarkIcon /> Guardadas
              </a>
            </div>
            <ul class={s.categorias}>
              {categorias.value.map((c) => {
                const foto = c.platos.map((p) => fotos.value[p.id]).find(Boolean)
                return (
                  <li key={c.id}>
                    <a class={s.categoria} href={paths.dishes(c.id)}>
                      {/* La foto arriba y el nombre debajo, en negro: se lee siempre (usuario, 2026-11-21) */}
                      <span
                        class={s.categoriaFoto}
                        aria-hidden="true"
                        style={foto ? { backgroundImage: `url(${foto})` } : undefined}
                      />
                      <b>{c.nombre}</b>
                      <span>
                        {c.platos.length} {c.platos.length === 1 ? 'receta' : 'recetas'}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
          {onCrear && (
            <button type="button" class={`${a.pastilla} ${s.crear}`} onClick={onCrear}>
              <PlusIcon /> Crear tu receta
            </button>
          )}
        </>
      )}
      {filtrar && (
        <FiltrosHoja
          platos={base}
          filtro={filtro ?? FILTRO_RECETAS}
          onAplicar={setFiltro}
          onClose={() => setFiltrar(false)}
        />
      )}
    </div>
  )
}
