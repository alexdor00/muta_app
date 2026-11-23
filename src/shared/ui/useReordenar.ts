// Mover filas de una lista con su asa (≡): se arrastra sin esperar y la lista se ve ya con la fila en su sitio nuevo; con
// el teclado, las flechas sobre el asa. Lo usan las listas de Editar rutina (tu semana y los ejercicios de una sesión).
import type { TargetedKeyboardEvent, TargetedPointerEvent } from 'preact'
import { useRef, useState } from 'preact/hooks'

type Puntero = (e: TargetedPointerEvent<HTMLButtonElement>) => void

/** Lo que lleva el asa de una fila. */
type Asa = {
  onPointerDown: Puntero
  onPointerMove: Puntero
  onPointerUp: Puntero
  onPointerCancel: Puntero
  onKeyDown: (e: TargetedKeyboardEvent<HTMLButtonElement>) => void
}

/**
 * `n` filas; `onMover(de, a)` al soltar en otro puesto. Devuelve la lista (`listaRef`, cada hijo es una fila), el orden con
 * el que se pinta mientras se arrastra, la fila levantada y lo que lleva el asa de cada fila.
 */
export function useReordenar(n: number, onMover: (de: number, a: number) => void) {
  const listaRef = useRef<HTMLOListElement>(null)
  const [arrastre, setArrastre] = useState<{ de: number; a: number } | null>(null)

  const orden = Array.from({ length: n }, (_, i) => i)
  if (arrastre) {
    const [x] = orden.splice(arrastre.de, 1)
    orden.splice(arrastre.a, 0, x)
  }

  // El puesto bajo el dedo: la primera fila cuya mitad queda por debajo
  const puestoEn = (y: number) => {
    const filas = [...(listaRef.current?.children ?? [])].slice(0, n)
    const i = filas.findIndex((f) => {
      const r = f.getBoundingClientRect()
      return y < r.top + r.height / 2
    })
    return i < 0 ? filas.length - 1 : i
  }

  const asa = (i: number): Asa => ({
    // El asa se queda el gesto: la fila no se desliza ni se abre
    onPointerDown: (e) => {
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      setArrastre({ de: i, a: i })
    },
    onPointerMove: (e) => {
      e.stopPropagation()
      if (arrastre) setArrastre({ ...arrastre, a: puestoEn(e.clientY) })
    },
    onPointerUp: (e) => {
      e.stopPropagation()
      if (arrastre && arrastre.a !== arrastre.de) onMover(arrastre.de, arrastre.a)
      setArrastre(null)
    },
    onPointerCancel: () => setArrastre(null),
    onKeyDown: (e) => {
      const a = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : null
      if (a === null || a < 0 || a >= n) return
      e.preventDefault()
      onMover(i, a)
    },
  })

  return { listaRef, orden, levantada: arrastre?.de ?? null, asa }
}
