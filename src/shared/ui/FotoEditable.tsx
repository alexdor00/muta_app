import type { ComponentChildren } from 'preact'
import { useRef, useState } from 'preact/hooks'
import styles from './FotoEditable.module.css'

/**
 * Poner una foto tuya y centrarla (la sesión de Entreno, tus recetas de Nutrición; usuario, 2026-11-17: igual en los dos):
 * cómo queda, que se arrastra para centrarla (se ve al momento y se guarda al soltar), «Elegir de la galería», «Hacer
 * una foto» y, si es tuya, «Quitar la foto». Se guarda solo en el móvil.
 */
export function FotoEditable(props: {
  /** La foto que se ve (la tuya o la de serie); null, sin foto. */
  foto: string | null
  alt: string
  /** Dónde está centrada (en %). */
  encuadre: { x: number; y: number }
  onCentrar: (x: number, y: number) => void
  onFoto: (archivo: File) => void
  /** Solo si la foto es tuya. */
  onQuitar?: () => void
  /** Encima de la foto, abajo (el nombre). */
  children?: ComponentChildren
  /** Entre la foto y los botones (las fotos de la app, en Entreno). */
  entre?: ComponentChildren
}) {
  const [punto, setPunto] = useState(props.encuadre)
  const arrastreRef = useRef<{ x: number; y: number; desde: { x: number; y: number } } | null>(null)
  const elegir = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement
    const archivo = input.files?.[0]
    if (archivo) props.onFoto(archivo)
    input.value = ''
  }
  return (
    <>
      <div class={`${styles.preview} ${props.foto ? styles.withPhoto : ''}`}>
        {props.foto && (
          <img
            class={styles.arrastrable}
            src={props.foto}
            alt={props.alt}
            draggable={false}
            style={{ objectPosition: `${punto.x}% ${punto.y}%` }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              arrastreRef.current = { x: e.clientX, y: e.clientY, desde: punto }
            }}
            onPointerMove={(e) => {
              const a = arrastreRef.current
              if (!a) return
              const caja = e.currentTarget.getBoundingClientRect()
              // Mover el dedo a la derecha enseña lo de la izquierda: el % baja
              const x = Math.min(100, Math.max(0, a.desde.x - ((e.clientX - a.x) / caja.width) * 100))
              const y = Math.min(100, Math.max(0, a.desde.y - ((e.clientY - a.y) / caja.height) * 100))
              setPunto({ x: Math.round(x), y: Math.round(y) })
            }}
            onPointerUp={() => {
              if (arrastreRef.current) props.onCentrar(punto.x, punto.y)
              arrastreRef.current = null
            }}
            onPointerCancel={() => (arrastreRef.current = null)}
          />
        )}
        {props.children}
      </div>
      {props.foto && <p class={styles.centrarAyuda}>Arrastra la foto para centrarla.</p>}
      {props.entre}
      <label class={styles.primary}>
        Elegir de la galería
        <input type="file" accept="image/*" onChange={elegir} />
      </label>
      <label class={styles.secondary}>
        Hacer una foto
        <input type="file" accept="image/*" capture="environment" onChange={elegir} />
      </label>
      {props.onQuitar && (
        <button type="button" class={styles.remove} onClick={props.onQuitar}>
          Quitar la foto
        </button>
      )}
      <p class={styles.note}>Tu foto se guarda solo en tu móvil.</p>
    </>
  )
}
