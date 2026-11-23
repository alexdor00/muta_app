import { formatDecimal, formatInt } from '../../../../shared/lib/format.ts'
import r from './Racion.module.css'

/**
 * Lo que aporta una cantidad: kcal, proteína, hidratos y grasa en cuatro cifras. La misma al apuntar un alimento y al
 * añadir algo más a tu menú (usuario, 2026-11-19: «como en la pantalla principal»).
 */
export function CifrasRacion(props: { m: { kcal: number; protein: number; carbs: number; fat: number } }) {
  const { m } = props
  return (
    <section class={r.cifras} aria-label="Lo que aporta">
      {[
        [formatInt(m.kcal), '', 'kcal'],
        [formatDecimal(m.protein), ' g', 'Proteína'],
        [formatDecimal(m.carbs), ' g', 'Hidratos'],
        [formatDecimal(m.fat), ' g', 'Grasa'],
      ].map(([v, u, l]) => (
        <div key={l}>
          <b>
            {v}
            {u}
          </b>
          <span>{l}</span>
        </div>
      ))}
    </section>
  )
}
