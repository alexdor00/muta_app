import type { ComponentChildren } from 'preact'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { EditarObjetivoHoja } from '../objetivo/EditarObjetivoHoja.tsx'
import { ObjetivoCompacto } from '../objetivo/ObjetivoCompacto.tsx'
import styles from './Vistas.module.css'

/**
 * Tu plan: lo que se configura. Arriba tu objetivo en pequeño («Editar» abre qué quieres, a qué velocidad, tus kcal, cómo
 * se calcula y tus datos) y debajo tus menús de la semana, tu dieta y las herramientas (compra, cocina, recordatorios).
 */
export function PlanVista({ children }: { children: ComponentChildren }) {
  const editar = useSheet('objetivo')
  return (
    <div class={styles.stack}>
      <div class={styles.pad}>
        <ObjetivoCompacto onEditar={editar.show} />
      </div>
      {children}
      {editar.open && <EditarObjetivoHoja onClose={editar.close} />}
    </div>
  )
}
