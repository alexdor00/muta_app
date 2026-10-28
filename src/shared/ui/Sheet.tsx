import type { ComponentChildren } from 'preact'
import { useEffect } from 'preact/hooks'
import { CloseIcon } from './icons.tsx'
import { RoundButton } from './RoundButton.tsx'
import styles from './Sheet.module.css'

type Props = {
  title: string
  onClose: () => void
  children: ComponentChildren
  /** Botones fijos abajo (p. ej. «Ver 12 rutinas»). */
  footer?: ComponentChildren
}

/** Hoja que sube desde abajo. Se cierra con la X, tocando fuera o con Escape. */
export function Sheet({ title, onClose, children, footer }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div class={styles.backdrop} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section class={styles.sheet} role="dialog" aria-modal="true" aria-label={title}>
        <header class={styles.header}>
          <span />
          <h2 class={styles.title}>{title}</h2>
          <RoundButton label="Cerrar" variant="plain" onClick={onClose}>
            <CloseIcon />
          </RoundButton>
        </header>
        <div class={styles.body}>{children}</div>
        {footer && <footer class={styles.footer}>{footer}</footer>}
      </section>
    </div>
  )
}
