import type { ComponentChildren } from 'preact'
import { paths } from '../../../../shared/lib/paths.ts'
import { PencilIcon } from '../../../../shared/ui/icons.tsx'
import { TarjetaObjetivo } from '../objetivo/TarjetaObjetivo.tsx'
import styles from './Vistas.module.css'

/**
 * Tu plan: lo que se configura. Arriba tu objetivo (fase, kcal y macros; «Cómo sale» lleva a Tu objetivo con la
 * revisión y el historial) y debajo tus menús de la semana, la compra, la cocina, los avisos y tu dieta pautada.
 */
export function PlanVista({ children }: { children: ComponentChildren }) {
  return (
    <div class={styles.stack}>
      <div class={styles.pad}>
        <TarjetaObjetivo>
          <a href={`${paths.nutritionTarget}?hoja=fase`}>Cambiar fase</a>
          <a href={`${paths.nutritionTarget}?hoja=mano`}>
            <PencilIcon /> Fijar a mano
          </a>
          <a href={paths.nutritionTarget}>Cómo sale ›</a>
        </TarjetaObjetivo>
      </div>
      {children}
    </div>
  )
}
