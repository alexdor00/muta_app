import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import styles from './SinPlan.module.css'

/** Sin rutina elegida: lo dice y lleva al catálogo. */
export function SinPlan() {
  return (
    <>
      <ScreenHeader title="Entrenamiento" avatarHref={paths.profile} inline />
      <section class={styles.empty}>
        <p>Aún no has elegido rutina.</p>
        <Button href={paths.chooseRoutine}>Elegir rutina</Button>
      </section>
    </>
  )
}
