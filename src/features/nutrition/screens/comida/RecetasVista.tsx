import { useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { SearchIcon } from '../../../../shared/ui/icons.tsx'
import { Carrusel, PlatoFila, PlatoTarjeta } from '../../components/Platos.tsx'
import {
  buscarPlatos,
  categorias,
  estadoRecetas,
  fotos,
  paraLaSiguiente,
  platos,
  siguiente,
  totalDePlato,
} from '../../state/recetas.ts'
import { comidaDe, macrosCortos } from '../comun/platos.ts'
import h from '../comun/Hojas.module.css'
import styles from './Vistas.module.css'

/** Recetas: buscar, las que mejor cuadran con lo que te falta (ya ajustadas) y las categorías del recetario. */
export function RecetasVista() {
  const [texto, setTexto] = useState('')
  if (estadoRecetas.value !== 'listo') return null
  const encontrados = texto.trim() ? buscarPlatos(platos.value, texto).slice(0, 40) : null
  const s = siguiente.value
  const ejemplo = categorias.value.some((c) => c.id === 'ejemplo')
  return (
    <div class={styles.stack}>
      <div class={styles.pad}>
        <label class={h.search}>
          <SearchIcon />
          <input
            type="search"
            value={texto}
            placeholder="Buscar receta o ingrediente"
            aria-label="Buscar una receta o un ingrediente"
            enterKeyHint="search"
            onInput={(e) => setTexto(e.currentTarget.value)}
          />
        </label>
      </div>
      {encontrados && !encontrados.length ? (
        <p class={`${styles.pad} ${h.sub}`}>Ninguna receta lleva «{texto.trim()}».</p>
      ) : encontrados ? (
        <ul class={`${styles.pad} ${h.list}`}>
          {encontrados.map((p) => (
            <PlatoFila
              key={p.id}
              nombre={p.nombre}
              foto={fotos.value[p.id] ?? null}
              lineas={[macrosCortos(totalDePlato(p))]}
              href={paths.dish(p.id)}
            />
          ))}
        </ul>
      ) : (
        <>
          {s && paraLaSiguiente.value.length > 0 && (
            <Carrusel
              id="para-ti"
              titulo={`Para ${comidaDe(s.comida).el}`}
              extra={`te faltan ${formatInt(s.objetivo.kcal)} kcal`}
            >
              {paraLaSiguiente.value.map((e) => (
                <PlatoTarjeta
                  key={e.plato.id}
                  nombre={e.plato.nombre}
                  foto={fotos.value[e.plato.id] ?? null}
                  linea={`≈ ${formatInt(e.ajuste.total.kcal)} kcal · ${formatInt(e.ajuste.total.protein)} P${e.plato.ajustable ? ' · ajustada' : ''}`}
                  href={paths.dish(e.plato.id, { comida: s.comida })}
                />
              ))}
            </Carrusel>
          )}
          {categorias.value.map((c) => (
            <Carrusel
              key={c.id}
              id={`cat-${c.id}`}
              titulo={c.nombre}
              extra={String(c.platos.length)}
              href={paths.dishes(c.id)}
            >
              {c.platos.slice(0, 8).map((p) => {
                const t = totalDePlato(p)
                return (
                  <PlatoTarjeta
                    key={p.id}
                    nombre={p.nombre}
                    foto={fotos.value[p.id] ?? null}
                    linea={`${formatInt(t.kcal)} kcal · ${formatInt(t.protein)} P`}
                    href={paths.dish(p.id)}
                  />
                )
              })}
            </Carrusel>
          ))}
          {ejemplo && (
            <p class={`${styles.pad} ${styles.foot}`}>
              Son los platos de la dieta de ejemplo: con un recetario cargado salen sus recetas por categoría.
            </p>
          )}
        </>
      )}
    </div>
  )
}
