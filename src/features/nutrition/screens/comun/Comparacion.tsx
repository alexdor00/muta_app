import { formatInt } from '../../../../shared/lib/format.ts'
import type { Macros } from '../../state/comida.ts'
import h from './Hojas.module.css'

const parte = (x: number, de: number) => `${de > 0 ? Math.min(100, Math.round((x / de) * 100)) : 0}%`

/** Lo que queda frente a lo que buscas: kcal y los tres macros, con su barra («850 / 880»). */
export function Comparacion({
  titulo,
  total,
  objetivo,
}: {
  titulo: string
  total: Macros
  objetivo: Macros
}) {
  const filas: [string, keyof Macros, string][] = [
    ['kcal', 'kcal', ''],
    ['Proteína', 'protein', ' g'],
    ['Hidratos', 'carbs', ' g'],
    ['Grasa', 'fat', ' g'],
  ]
  return (
    <section class={h.card} aria-label={titulo}>
      <p class={h.eyebrow}>{titulo}</p>
      {filas.map(([nombre, k, u]) => (
        <div key={k}>
          <p class={h.line}>
            <span>{nombre}</span>
            <b>
              {formatInt(total[k])} / {formatInt(objetivo[k])}
              {u}
            </b>
          </p>
          <div class={h.track} aria-hidden="true">
            <i style={{ width: parte(total[k], objetivo[k]) }} />
          </div>
        </div>
      ))}
    </section>
  )
}
