import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { ChevronLeftIcon } from './icons.tsx'
import { RoundButton } from './RoundButton.tsx'
import styles from './CompactBar.module.css'

type Props = {
  title: string
  backHref: string
  /** Acción de la derecha (icono). */
  action?: ComponentChildren
  /** Cabecera grande: la barra aparece cuando deja de verse. */
  watch: { current: HTMLElement | null }
}

/** Barra fija arriba que aparece al bajar, cuando la cabecera grande ya no se ve. */
export function CompactBar({ title, backHref, action, watch }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = watch.current
    if (!target || !('IntersectionObserver' in window)) return
    // Aparece cuando la cabecera queda por encima de la barra.
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: '-60px 0px 0px 0px',
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [watch])

  return (
    <div class={`${styles.bar} ${visible ? styles.visible : ''}`} aria-hidden={!visible}>
      <RoundButton label="Volver" href={backHref} variant="plain">
        <ChevronLeftIcon />
      </RoundButton>
      <p class={styles.title}>{title}</p>
      <span>{action}</span>
    </div>
  )
}
