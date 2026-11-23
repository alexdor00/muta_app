import { paths } from '../../../../shared/lib/paths.ts'
import styles from './ComidaScreen.module.css'

/** Sin objetivo ni dieta: calcularlo con tus datos o seguir la dieta de tu nutricionista. */
export function SinObjetivo({ onCalcular }: { onCalcular: () => void }) {
  return (
    <section class={styles.empty}>
      <h2 class={styles.emptyTitle}>Calcula tu objetivo</h2>
      <p class={styles.emptyText}>
        Con tu sexo, edad, altura, peso y pasos al día calculo lo que gastas y cuánto comer para tu fase. Lo
        ves paso a paso y lo puedes cambiar.
      </p>
      <button type="button" class={styles.emptyButton} onClick={onCalcular}>
        Calcular mi objetivo
      </button>
      <a class={styles.emptyLink} href={`${paths.nutrition}?vista=dieta`}>
        O sigue la dieta de tu nutricionista
      </a>
    </section>
  )
}
