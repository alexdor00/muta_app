// Tocar una gráfica para ver un punto (todas las de la app, usuario 2026-11-14): sigue al dedo aunque se salga del dibujo,
// el punto se queda al levantarlo y se quita al tocar fuera; con el ratón, al pasar por encima y se quita al salir.
import type { TargetedPointerEvent } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

/** Devuelve dónde está el dedo a lo ancho del dibujo (de 0 a 1; null si no hay nada elegido) y lo que lleva el `<svg>`. */
export function useTocarGrafica() {
  const ref = useRef<SVGSVGElement>(null)
  const [parte, setParte] = useState<number | null>(null)
  const elegir = (e: PointerEvent) => {
    const caja = ref.current?.getBoundingClientRect()
    if (!caja?.width) return
    setParte(Math.min(1, Math.max(0, (e.clientX - caja.left) / caja.width)))
  }
  // Tocar fuera de la gráfica quita el punto
  const hay = parte !== null
  useEffect(() => {
    if (!hay) return
    const fuera = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setParte(null)
    }
    document.addEventListener('pointerdown', fuera)
    return () => document.removeEventListener('pointerdown', fuera)
  }, [hay])
  const svg = {
    ref,
    onPointerDown: (e: TargetedPointerEvent<SVGSVGElement>) => {
      // El dedo es de la gráfica hasta que se levanta, aunque salga del dibujo
      e.currentTarget.setPointerCapture?.(e.pointerId)
      elegir(e)
    },
    onPointerMove: (e: TargetedPointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'mouse' || e.buttons) elegir(e)
    },
    onPointerLeave: (e: TargetedPointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'mouse') setParte(null)
    },
  }
  return { parte, svg }
}
