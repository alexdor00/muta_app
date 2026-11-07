import { formatInt } from '../../../../shared/lib/format.ts'
import type { Macros } from '../../state/comida.ts'
import h from './Hojas.module.css'

/** Las cuatro cifras en tarjeta: kcal, proteína, hidratos y grasa (los gramos, sin unidad: lo dice la etiqueta). */
export function Cifras({ total }: { total: Macros }) {
  return (
    <div class={h.tiles}>
      {(
        [
          [formatInt(total.kcal), 'kcal'],
          [formatInt(total.protein), 'proteína'],
          [formatInt(total.carbs), 'hidratos'],
          [formatInt(total.fat), 'grasa'],
        ] as const
      ).map(([v, l]) => (
        <div key={l} class={h.tile}>
          <span class={h.tileValue}>{v}</span>
          <span class={h.foot}>{l}</span>
        </div>
      ))}
    </div>
  )
}
