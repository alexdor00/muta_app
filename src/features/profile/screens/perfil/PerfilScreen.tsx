import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronLeftIcon } from '../../../../shared/ui/icons.tsx'
import { TuMaterial } from '../../../training/index.ts'
import styles from './PerfilScreen.module.css'

/**
 * Perfil: por ahora solo «Tu material» (lo usa Entreno en la biblioteca y al cambiar un ejercicio). Tus datos, rehacer el
 * plan y la copia de seguridad llegarán con su diseño.
 */
export function PerfilScreen() {
  return (
    <div class={styles.page}>
      <header class={styles.bar}>
        <a class={styles.back} href={paths.training} aria-label="Volver a Tu plan">
          <ChevronLeftIcon />
        </a>
        <h1 class={styles.title}>Perfil</h1>
        <span />
      </header>
      <TuMaterial />
    </div>
  )
}
