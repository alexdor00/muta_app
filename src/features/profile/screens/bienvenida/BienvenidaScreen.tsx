import { paths } from '../../../../shared/lib/paths.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import styles from './BienvenidaScreen.module.css'

/** A01 · Bienvenida. Tu diseño: foto a pantalla completa, MUTA, lema y «Comenzar». */
export function BienvenidaScreen() {
  return (
    <section class={styles.screen} aria-labelledby="bienvenida-titulo">
      <img class={styles.photo} src="/photos/bienvenida.jpg" alt="" fetchpriority="high" />
      <div class={styles.scrim} />
      <div class={styles.brand}>
        <h1 id="bienvenida-titulo" class={styles.logo}>
          MUTA
        </h1>
        <p class={styles.tagline}>Entrena. Come. Evoluciona.</p>
      </div>
      <div class={styles.actions}>
        <Button variant="onPhoto" chevron href={paths.onboarding(1)}>
          Comenzar
        </Button>
      </div>
    </section>
  )
}
