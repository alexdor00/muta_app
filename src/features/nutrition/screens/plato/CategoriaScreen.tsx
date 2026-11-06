import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChoiceChips } from '../../../../shared/ui/Choice.tsx'
import { PlatoFila } from '../../components/Platos.tsx'
import { estado } from '../../state/comida.ts'
import { ajustar, categorias, estadoRecetas, fotos, siguiente, totalDePlato } from '../../state/recetas.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { Barra } from '../comun/Barra.tsx'
import { comidaDe, macrosCortos } from '../comun/platos.ts'
import p from '../comun/Pagina.module.css'
import h from '../comun/Hojas.module.css'
import styles from './Plato.module.css'

type Filtro = 'todas' | 'cuadran' | 'proteina' | 'rapidas'

/** Los platos de una categoría, con filtros: los que cuadran con lo que te falta, más proteína y poco tiempo. */
export function CategoriaScreen(props: { categoria: string }) {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  const [filtro, setFiltro] = useState<Filtro>('todas')
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  const c = categorias.value.find((x) => x.id === props.categoria)
  const volver = `${paths.nutrition}?vista=recetas`
  if (!c) {
    return (
      <div class={p.page}>
        <Barra titulo="Recetas" volver={volver} />
        <p class={h.sub}>Esta categoría no tiene recetas.</p>
      </div>
    )
  }
  const s = siguiente.value
  const conTotal = c.platos.map((x) => ({ plato: x, total: totalDePlato(x) }))
  const lista =
    filtro === 'cuadran' && s
      ? conTotal.filter(({ plato }) => {
          const a = ajustar(plato, s.objetivo)
          return !a.corto.length && !a.sobra.length
        })
      : filtro === 'proteina'
        ? [...conTotal].sort(
            (x, y) => y.total.protein / (y.total.kcal || 1) - x.total.protein / (x.total.kcal || 1),
          )
        : filtro === 'rapidas'
          ? conTotal.filter(({ plato }) => plato.minutos !== null && plato.minutos <= 20)
          : conTotal
  const opciones: { value: Filtro; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    ...(s ? [{ value: 'cuadran' as const, label: `Para ${comidaDe(s.comida).el}` }] : []),
    { value: 'proteina', label: 'Más proteína' },
    { value: 'rapidas', label: 'Rápidas' },
  ]
  return (
    <div class={p.page}>
      <Barra titulo={c.nombre} volver={volver} />
      <div class={styles.filtros}>
        <ChoiceChips<Filtro>
          name="filtro-platos"
          legend="Filtrar"
          options={opciones}
          value={filtro}
          onChange={setFiltro}
        />
      </div>
      <p class={h.foot}>
        {lista.length} {lista.length === 1 ? 'receta' : 'recetas'}
        {filtro === 'rapidas' ? ' de 20 minutos o menos' : ''}
        {filtro === 'cuadran' && s ? ` que caben en lo que te queda` : ''}
      </p>
      {lista.length ? (
        <ul class={h.list}>
          {lista.map(({ plato, total }) => (
            <PlatoFila
              key={plato.id}
              nombre={plato.nombre}
              foto={fotos.value[plato.id] ?? null}
              lineas={[
                macrosCortos(total),
                [plato.minutos ? `${plato.minutos} min` : '', plato.dificultad].filter(Boolean).join(' · '),
              ].filter(Boolean)}
              href={paths.dish(plato.id, s && filtro === 'cuadran' ? { comida: s.comida } : undefined)}
            />
          ))}
        </ul>
      ) : (
        <p class={h.sub}>Ninguna con este filtro.</p>
      )}
    </div>
  )
}
