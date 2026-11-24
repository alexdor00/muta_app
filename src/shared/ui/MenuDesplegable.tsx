import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { ChevronDownIcon } from './icons.tsx'
import styles from './MenuDesplegable.module.css'

type Props<T extends string> = {
  /** Qué se elige (para el lector de pantalla y el título del menú): «Tramo», «En qué comida». */
  etiqueta: string
  valor: T
  opciones: readonly { value: T; label: string }[]
  onChange: (valor: T) => void
  /** Para unirlo a su <label for>. */
  id?: string
  /** Hacia qué lado se abre el menú (de serie, a la derecha: alineado con el botón por su borde derecho). */
  lado?: 'derecha' | 'izquierda'
  /** Del tamaño de las pastillas de una gráfica (Tonelaje · Repeticiones · Duración). */
  pequeno?: boolean
}

/**
 * Un desplegable de MUTA (usuario, 2026-11-24: «todos los desplegables de la app así de bonitos»): un botón pequeño con lo
 * elegido y ▾; al tocarlo, un menú flotante con las opciones y ✓ en la elegida. Se cierra al elegir, al tocar fuera o con
 * Escape. El mismo en toda la app (regla 11): las gráficas, Nutrición, Entreno y Progreso.
 */
export function MenuDesplegable<T extends string>({
  etiqueta,
  valor,
  opciones,
  onChange,
  id,
  lado = 'derecha',
  pequeno = false,
}: Props<T>) {
  const [abierto, setAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const actual = opciones.find((o) => o.value === valor)?.label ?? valor

  useEffect(() => {
    if (!abierto) return
    const menu = menuRef.current
    // Si no cabe debajo (al final de una hoja), se abre hacia arriba
    if (menu && menu.getBoundingClientRect().bottom > window.innerHeight) menu.classList.add(styles.arriba)
    // Al abrir, el foco en la elegida (con el teclado se sigue con Tab o las flechas)
    menu?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cierra el menú, no la hoja en la que está
        e.stopPropagation()
        setAbierto(false)
        botonRef.current?.focus()
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const botones = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
        const i = botones.indexOf(document.activeElement as HTMLButtonElement)
        botones[(i + (e.key === 'ArrowDown' ? 1 : -1) + botones.length) % botones.length]?.focus()
      }
    }
    // En captura y en window: llega antes que el Escape de la hoja (en document)
    window.addEventListener('keydown', tecla, true)
    return () => window.removeEventListener('keydown', tecla, true)
  }, [abierto])

  return (
    <span class={styles.envoltura}>
      <button
        ref={botonRef}
        id={id}
        type="button"
        class={`${styles.boton} ${pequeno ? styles.pequeno : ''}`}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={`${etiqueta}: ${actual}`}
        onClick={() => setAbierto(!abierto)}
      >
        {actual}
        <ChevronDownIcon />
      </button>
      {abierto && (
        <>
          <span class={styles.fuera} onClick={() => setAbierto(false)} aria-hidden="true" />
          <div
            ref={menuRef}
            class={`${styles.menu} ${lado === 'izquierda' ? styles.izquierda : ''}`}
            role="listbox"
            aria-label={etiqueta}
          >
            {opciones.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === valor}
                class={styles.opcion}
                onClick={() => {
                  setAbierto(false)
                  if (o.value !== valor) onChange(o.value)
                  botonRef.current?.focus()
                }}
              >
                <span class={styles.marca} aria-hidden="true">
                  {o.value === valor ? '✓' : ''}
                </span>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  )
}

/** Una fila con su título a la izquierda y el desplegable a la derecha; debajo, si lleva, lo que explica (siempre a la vista). */
export function FilaDesplegable<T extends string>(
  props: Props<T> & { titulo: string; explica?: ComponentChildren },
) {
  const { titulo, explica, ...menu } = props
  return (
    <div class={styles.fila}>
      <div class={styles.linea}>
        <span>{titulo}</span>
        <MenuDesplegable {...menu} />
      </div>
      {explica && <small class={styles.explica}>{explica}</small>}
    </div>
  )
}
