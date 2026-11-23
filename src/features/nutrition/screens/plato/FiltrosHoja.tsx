import { useState } from 'preact/hooks'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { recetasCon } from '../../state/filtroRecetas.ts'
import { FILTRO_RECETAS, type FiltroRecetas, type Plato } from '../../state/recetas.ts'
import ap from './Apuntar.module.css'
import s from './Recetas.module.css'

/** De serie, de la A a la Z (no sale aquí: «Borrar» vuelve a ella; usuario, 2026-11-21). */
const ORDEN: { value: FiltroRecetas['orden']; label: string; detalle?: string }[] = [
  { value: 'falta', label: 'Lo que me falta hoy', detalle: 'Las que mejor cuadran con tu día' },
  { value: 'proteina', label: 'Más proteína' },
  { value: 'kcal', label: 'Menos calorías' },
  { value: 'rapidas', label: 'Más rápidas' },
]
type Tiempo = '15' | '30' | 'sin'
const TIEMPO: { value: Tiempo; label: string }[] = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: 'sin', label: 'Sin prisa' },
]
type Dificultad = 'todas' | 'Fácil' | 'Intermedia' | 'Avanzada'
const DIFICULTAD: { value: Dificultad; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'Fácil', label: 'Fácil' },
  { value: 'Intermedia', label: 'Intermedia' },
  { value: 'Avanzada', label: 'Avanzada' },
]

/**
 * Filtrar y ordenar recetas (usuario, 2026-11-21; `Desktop/MUTA-Filtros-propuesta.png`, sin iconos): el orden en filas con
 * su ✓, y el tiempo y la dificultad en un selector (en dificultad, «Todas» para no filtrar); el botón dice cuántas salen.
 */
export function FiltrosHoja(props: {
  platos: readonly Plato[]
  filtro: FiltroRecetas
  onAplicar: (f: FiltroRecetas) => void
  onClose: () => void
}) {
  const [f, setF] = useState(props.filtro)
  const cambiar = (x: Partial<FiltroRecetas>) => setF({ ...f, ...x })
  const n = recetasCon(props.platos, f).length
  return (
    <Sheet
      title="Filtrar y ordenar"
      onClose={props.onClose}
      large
      accion={
        <button type="button" class={s.borrar} onClick={() => setF(FILTRO_RECETAS)}>
          Borrar
        </button>
      }
      footer={
        <Button
          onClick={() => {
            props.onAplicar(f)
            props.onClose()
          }}
        >
          Ver {n} {n === 1 ? 'receta' : 'recetas'}
        </Button>
      }
    >
      <div class={ap.hoja}>
        <section>
          <h3 class={ap.rotulo}>Ordenar por</h3>
          <ul class={s.ordenes} role="radiogroup" aria-label="Ordenar por">
            {ORDEN.map((o) => {
              const on = f.orden === o.value
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    class={s.orden}
                    onClick={() => cambiar({ orden: o.value })}
                  >
                    <span class={s.ordenTexto}>
                      {o.label}
                      {o.detalle && <small>{o.detalle}</small>}
                    </span>
                    {on && (
                      <span class={s.ordenOk} aria-hidden="true">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
        <section>
          <h3 class={ap.rotulo}>Tiempo</h3>
          <ChoiceSegmented<Tiempo>
            name="filtro-tiempo"
            legend="Tiempo"
            options={TIEMPO}
            value={f.tiempo === 15 ? '15' : f.tiempo === 30 ? '30' : 'sin'}
            onChange={(t) => cambiar({ tiempo: t === '15' ? 15 : t === '30' ? 30 : null })}
          />
        </section>
        <section>
          <h3 class={ap.rotulo}>Dificultad</h3>
          <ChoiceSegmented<Dificultad>
            name="filtro-dificultad"
            legend="Dificultad"
            options={DIFICULTAD}
            value={f.dificultad ?? 'todas'}
            onChange={(d) => cambiar({ dificultad: d === 'todas' ? null : d })}
          />
        </section>
      </div>
    </Sheet>
  )
}
