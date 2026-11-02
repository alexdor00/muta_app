import { ArrowLeftIcon, DumbbellIcon } from '../../../shared/ui/icons.tsx'
import styles from './SessionHero.module.css'
import tones from './sessionTone.module.css'

type Props = {
  sigla: string
  nombre: string
  /** «7 ejercicios · 24 series · 65 min». */
  detalle: string
  /** El color de su tarjeta en Tu plan (hasta que haya fotos). */
  tono: 1 | 2 | 3 | 4
  backHref: string
}

/** Cabecera de Ver sesión: volver, la sigla grande, el nombre y los datos, sobre el color de la sesión. */
export function SessionHero({ sigla, nombre, detalle, tono, backHref }: Props) {
  return (
    <header class={`${styles.hero} ${tones[`tone${tono}`]}`}>
      <div class={styles.bar}>
        <a class={styles.back} href={backHref} aria-label="Volver a Tu plan">
          <ArrowLeftIcon />
        </a>
        <span class={styles.barTitle} aria-hidden="true">
          {sigla}
        </span>
      </div>
      <div class={styles.text}>
        <h1>
          <span class={styles.sigla}>{sigla}</span> <span class={styles.name}>{nombre}</span>
        </h1>
        <p class={styles.detail}>
          <DumbbellIcon />
          {detalle}
        </p>
      </div>
    </header>
  )
}
