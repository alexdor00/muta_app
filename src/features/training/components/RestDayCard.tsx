import { MoonIcon } from '../../../shared/ui/icons.tsx'
import styles from './RestDayCard.module.css'

/** Tarjeta de Tu plan cuando hoy toca descanso obligatorio: del tamaño de las de las sesiones, con la que viene después. */
export function RestDayCard(props: { siguiente: string | null }) {
  return (
    <section class={styles.card} aria-labelledby="hoy-descansas">
      <span class={styles.moon} aria-hidden="true">
        <MoonIcon />
      </span>
      <h2 id="hoy-descansas" class={styles.title}>
        Hoy descansas
      </h2>
      <p class={styles.text}>
        Es un descanso obligatorio de tu rutina.
        {props.siguiente && (
          <>
            {' '}
            La siguiente: <b>{props.siguiente}</b>.
          </>
        )}
      </p>
    </section>
  )
}
