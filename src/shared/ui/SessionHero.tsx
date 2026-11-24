import { ArrowLeftIcon, DumbbellIcon } from './icons.tsx'
import styles from './SessionHero.module.css'
import tones from './sessionTone.module.css'
import { useVolver } from './useVolver.ts'

type Props = {
  sigla: string
  nombre: string
  /** «7 ejercicios · 24 series · 65 min». */
  detalle: string
  /** El color de su tarjeta en Tu plan (hasta que haya fotos). */
  tono: 1 | 2 | 3 | 4
  /** La foto de la sesión (la tuya o la de serie): de fondo, con la letra en blanco. */
  foto?: string | null
  /** Dónde está centrada la foto («50% 30%»). */
  encuadre?: string
  backHref: string
  /** Lo que lee el lector de pantalla en la flecha atrás. */
  backLabel?: string
}

/**
 * Cabecera de Ver sesión (y de un día de Progreso): volver, la sigla grande, el nombre y los datos, sobre la foto de la
 * sesión (oscurecida abajo, letra blanca) o, sin ella, sobre su color.
 */
export function SessionHero({
  sigla,
  nombre,
  detalle,
  tono,
  foto = null,
  encuadre,
  backHref,
  backLabel = 'Volver a Tu plan',
}: Props) {
  // «‹» vuelve a la pantalla de la que vienes (Tu plan, Hoy, Progreso…); entrando directo, a backHref (useVolver)
  const volver = useVolver(backHref)
  return (
    <header class={`${styles.hero} ${foto ? styles.conFoto : tones[`tone${tono}`]}`}>
      {foto && <img class={styles.foto} src={foto} alt="" style={{ objectPosition: encuadre }} />}
      <div class={styles.bar}>
        <a
          class={styles.back}
          href={backHref}
          aria-label={backLabel}
          onClick={(e) => {
            e.preventDefault()
            volver()
          }}
        >
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
