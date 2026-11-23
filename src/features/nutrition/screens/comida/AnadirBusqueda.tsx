import type { JSX } from 'preact'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { BarcodeIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { PlatoFoto } from '../../components/Platos.tsx'
import { propios, type Alimento, type ComidaId } from '../../state/comida.ts'
import { buscarPlatos, fotos, platos, totalDePlato } from '../../state/recetas.ts'
import { buscar, quitar } from '../../use-cases/foodLog.ts'
import { apuntarPlato } from '../../use-cases/recipes.ts'
import type { Aviso } from '../comun/useAviso.ts'
import h from '../comun/Hojas.module.css'
import a from './Anadir.module.css'

export type Filtro = 'todo' | 'alimentos' | 'recetas' | 'tuyos'

/** Lo que sale al buscar en Añadir (rediseño 14): Todo · Alimentos · Recetas · Tuyos, las recetas con foto, y escanear o crear. */
export function AnadirBusqueda(props: {
  q: string
  comida: ComidaId
  filtro: Filtro
  onFiltro: (f: Filtro) => void
  fila: (x: Alimento, detalle?: string) => JSX.Element
  onEscanear: () => void
  onCrear: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}) {
  const { q, comida, filtro, avisar } = props
  const setFiltro = props.onFiltro
  const filaAlimento = props.fila
  const deshacer = (ids: string[]) => ({ label: 'Deshacer', onClick: () => void quitar(ids) })
  const alimentos =
    filtro === 'recetas'
      ? []
      : filtro === 'tuyos'
        ? buscar(q).filter((x) => propios.value.some((p) => p.id === x.id))
        : buscar(q)
  const recetas = filtro === 'todo' || filtro === 'recetas' ? buscarPlatos(platos.value, q).slice(0, 8) : []
  return (
    <>
      <div class={a.pastillas} role="group" aria-label="Qué buscar">
        {(
          [
            ['todo', 'Todo'],
            ['alimentos', 'Alimentos'],
            ['recetas', 'Recetas'],
            ['tuyos', 'Tuyos'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            class={`${a.pastilla} ${filtro === id ? a.on : ''}`}
            aria-pressed={filtro === id}
            onClick={() => setFiltro(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {alimentos.length > 0 && (
        <ul class={a.tarjeta}>
          {alimentos.map((x) =>
            filaAlimento(x, `${formatInt(x.kcal)} kcal por ${x.porRacion ? x.servingLabel : '100 g'}`),
          )}
        </ul>
      )}
      {recetas.length > 0 && (
        <section class={a.seccion} aria-labelledby="recetas-buscadas">
          <h3 id="recetas-buscadas" class={a.rotulo}>
            Recetas
          </h3>
          <ul class={a.tarjeta}>
            {recetas.map((p) => {
              const t = totalDePlato(p)
              return (
                <li key={p.id} class={a.fila}>
                  <PlatoFoto foto={fotos.value[p.id] ?? null} />
                  <a class={a.filaTexto} href={paths.dish(p.id)}>
                    <span class={a.nombre}>{p.nombre}</span>
                    <span class={a.detalle}>
                      {[
                        `${formatInt(t.kcal)} kcal`,
                        `${formatInt(t.protein)} g prot.`,
                        p.minutos ? `${p.minutos} min` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </a>
                  <button
                    type="button"
                    class={h.round}
                    aria-label={`Añadir ${p.nombre}`}
                    onClick={async () => {
                      const ids = await apuntarPlato(p, comida)
                      avisar(`${p.nombre}: ${formatInt(t.kcal)} kcal`, deshacer(ids))
                    }}
                  >
                    <PlusIcon />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {!alimentos.length && !recetas.length && (
        <p class={a.vacio}>
          No encuentro «{q}». Créalo con los valores de la etiqueta o apunta solo kcal y proteína.
        </p>
      )}
      <div class={a.pie}>
        <button type="button" class={a.pastilla} onClick={props.onEscanear}>
          <BarcodeIcon /> Escanear código
        </button>
        <button type="button" class={a.pastilla} onClick={props.onCrear}>
          <PlusIcon /> Crear alimento
        </button>
      </div>
    </>
  )
}
