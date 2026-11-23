import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { BookmarkIcon } from '../../../../shared/ui/icons.tsx'
import { fotos, recetasGuardadas, totalDePlato, type Plato } from '../../state/recetas.ts'
import { alternarRecetaGuardada } from '../../use-cases/recipes.ts'
import s from './Recetas.module.css'

/** Una receta en una lista (rediseño 28): su foto, nombre, kcal, proteína y minutos, y el marcador para guardarla. */
export function RecetaFila({ plato: p, comida }: { plato: Plato; comida?: string }) {
  const t = totalDePlato(p)
  const guardada = recetasGuardadas.value.includes(p.id)
  return (
    <li class={s.fila}>
      <a class={s.filaEnlace} href={paths.dish(p.id, comida ? { comida } : undefined)}>
        <span
          class={s.miniatura}
          aria-hidden="true"
          style={fotos.value[p.id] ? { backgroundImage: `url(${fotos.value[p.id]})` } : undefined}
        />
        <span class={s.filaTexto}>
          <b>{p.nombre}</b>
          <span>
            {[
              `${formatInt(t.kcal)} kcal`,
              `${formatInt(t.protein)} g prot.`,
              p.minutos ? `${p.minutos} min` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </a>
      <button
        type="button"
        class={s.marcador}
        aria-pressed={guardada}
        aria-label={guardada ? `Quitar ${p.nombre} de guardadas` : `Guardar ${p.nombre}`}
        onClick={() => void alternarRecetaGuardada(p.id)}
      >
        <BookmarkIcon filled={guardada} />
      </button>
    </li>
  )
}
