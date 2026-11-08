import type { ComponentChildren } from 'preact'
import { useRef, useState } from 'preact/hooks'
import { useDeslizar } from './useDeslizar.ts'
import styles from './Deslizable.module.css'

type Props = {
  /** Lo que dice el botón que asoma (de serie, «Quitar»). */
  label?: string
  /** Para el lector de pantalla: qué se quita («Quitar Yogur natural»). */
  ariaLabel: string
  onQuitar: () => void
  /** El fondo de la fila (el de lo que tiene detrás): blanco o el gris de una tarjeta. */
  fondo?: 'bg' | 'surface'
  children: ComponentChildren
}

/**
 * Una fila que se desliza a la izquierda para descubrir «Quitar» (como en la sesión de Entreno), sin una X a la vista.
 * Tocar la fila abierta la cierra; con el teclado, el botón se alcanza con Tab cuando está abierta.
 */
export function Deslizable({ label = 'Quitar', ariaLabel, onQuitar, fondo = 'bg', children }: Props) {
  const [abierta, setAbierta] = useState(false)
  const fila = useDeslizar(abierta, setAbierta)
  // Un toque que empezó con la fila ya abierta la cierra (el «clic» de soltar al deslizar no cuenta)
  const tocaAbiertaRef = useRef(false)
  return (
    <div class={styles.swipe}>
      <button
        type="button"
        class={styles.quitar}
        tabIndex={abierta ? 0 : -1}
        aria-hidden={!abierta}
        aria-label={ariaLabel}
        onClick={() => {
          setAbierta(false)
          onQuitar()
        }}
      >
        {label}
      </button>
      <div
        ref={fila}
        class={`${styles.fila} ${styles[fondo]} ${abierta ? styles.abierta : ''}`}
        onPointerDownCapture={() => {
          tocaAbiertaRef.current = abierta
        }}
        onClickCapture={(e) => {
          if (!abierta || !tocaAbiertaRef.current) return
          tocaAbiertaRef.current = false
          // Abierta, un toque solo la cierra (no abre lo que hay debajo)
          e.stopPropagation()
          e.preventDefault()
          setAbierta(false)
        }}
      >
        {children}
      </div>
    </div>
  )
}
