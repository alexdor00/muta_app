import { paths } from '../../../shared/lib/paths.ts'
import { PlayIcon } from '../../../shared/ui/icons.tsx'
import styles from './SessionCard.module.css'
import tones from '../../../shared/ui/sessionTone.module.css'

type Props = {
  sigla: string
  nombre: string
  detalle: string
  /** Cómo va en la semana: «Hoy», «Hecha», «Pendiente». */
  estado: string
  /** Color de la tarjeta (1–4: lima, rayas, naranja, negro). */
  tono: 1 | 2 | 3 | 4
  /** Tu foto de la sesión (A29–A30): de fondo, oscurecida para que se lea. */
  foto?: string | null
  /** Dónde está centrada la foto («50% 30%»). */
  encuadre?: string
}

/**
 * Tarjeta de color de una sesión, con la sigla de fondo (o tu foto): al tocarla se abre Ver sesión; la píldora blanca
 * «▶ Empezar» de abajo la empieza.
 */
export function SessionCard({ sigla, nombre, detalle, estado, tono, foto, encuadre }: Props) {
  return (
    <div class={styles.wrap}>
      <a
        class={`${styles.card} ${tones[`tone${tono}`]} ${tono === 2 || foto ? styles.noGhost : ''} ${foto ? styles.withPhoto : ''}`}
        href={paths.sessionView(sigla.toLowerCase())}
      >
        {foto && <img class={styles.photo} src={foto} alt="" style={{ objectPosition: encuadre }} />}
        <span class={styles.ghost} aria-hidden="true">
          {sigla}
        </span>
        <span class={styles.estado}>{estado}</span>
        <span class={styles.sigla}>{sigla}</span>
        <h2 class={styles.name}>{nombre}</h2>
        <span class={styles.detail}>{detalle}</span>
      </a>
      <a class={styles.play} href={paths.session(sigla.toLowerCase())} aria-label={`Empezar ${sigla}`}>
        <PlayIcon />
        Empezar
      </a>
    </div>
  )
}
