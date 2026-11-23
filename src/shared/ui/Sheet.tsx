import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { ChevronLeftIcon, CloseIcon } from './icons.tsx'
import { RoundButton } from './RoundButton.tsx'
import styles from './Sheet.module.css'

type Props = {
  title: string
  onClose: () => void
  children: ComponentChildren
  /** Botones fijos abajo (p. ej. «Ver 12 rutinas»). */
  footer?: ComponentChildren
  /** Título grande a la izquierda (Tu rutina) en vez de centrado. */
  large?: boolean
  /** «‹ Tu semana»: arriba a la izquierda, vuelve a la hoja de antes (las hojas encadenadas, como Editar rutina). */
  atras?: { label: string; onClick: () => void }
  /** Siempre a su alto máximo (las hojas encadenadas, como Editar rutina: al pasar de una a otra no cambia de tamaño). */
  alta?: boolean
  /** Un botón redondo junto a cerrar (el corazón de favoritos en la cantidad de Nutrición). */
  accion?: ComponentChildren
}

/** Cuándo se cerró la última hoja: si otra se abre justo después, la sustituye (hojas encadenadas). */
let ultimoCierre = 0
/** Cuántas hojas hay abiertas: la nueva se crea antes de que se quite la que sustituye. */
let abiertas = 0

/**
 * Hoja que sube desde abajo. Se cierra con la X, tocando fuera o con Escape. Si sustituye a otra al instante (Editar rutina:
 * tu semana → una sesión → un ejercicio), no vuelve a subir: se queda y su contenido entra con un fundido suave.
 */
export function Sheet({ title, onClose, children, footer, large, atras, alta, accion }: Props) {
  const [encadenada] = useState(() => abiertas > 0 || Date.now() - ultimoCierre < 200)
  useEffect(() => {
    abiertas += 1
    return () => {
      abiertas -= 1
      ultimoCierre = Date.now()
    }
  }, [])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      class={`${styles.backdrop} ${encadenada ? styles.encadenada : ''}`}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        class={`${styles.sheet} ${alta ? styles.alta : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {atras && (
          <button type="button" class={styles.atras} onClick={atras.onClick}>
            <ChevronLeftIcon />
            {atras.label}
          </button>
        )}
        <header class={`${styles.header} ${large ? styles.large : ''} ${accion ? styles.conAccion : ''}`}>
          {!large && <span />}
          <h2 class={styles.title}>{title}</h2>
          <span class={styles.acciones}>
            {accion}
            <RoundButton label="Cerrar" variant="plain" onClick={onClose}>
              <CloseIcon />
            </RoundButton>
          </span>
        </header>
        <div class={styles.body}>{children}</div>
        {footer && <footer class={styles.footer}>{footer}</footer>}
      </section>
    </div>
  )
}
