import { useEffect, useRef } from 'preact/hooks'

/** Cuánto se mueve un carrusel de una tarjeta a la siguiente (ancho más el hueco). */
export function carouselStep(el: HTMLElement) {
  const [first, second] = [el.children[0], el.children[1]]
  const paso =
    first instanceof HTMLElement && second instanceof HTMLElement
      ? second.offsetLeft - first.offsetLeft
      : el.clientWidth
  return paso || 1
}

/**
 * Carrusel que también se arrastra con el ratón (en el móvil ya se desliza con el dedo). Al soltar, va a la tarjeta
 * siguiente o anterior si se arrastró un poco, y el arrastre no cuenta como toque en la tarjeta.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let pulsado = false
    let arrastrado = false
    let x0 = 0
    let left0 = 0
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      pulsado = true
      arrastrado = false
      x0 = e.clientX
      left0 = el.scrollLeft
    }
    const move = (e: PointerEvent) => {
      if (!pulsado) return
      const dx = e.clientX - x0
      if (!arrastrado && Math.abs(dx) > 5) {
        arrastrado = true
        // Sin encaje mientras se arrastra, para que siga al ratón
        el.style.scrollSnapType = 'none'
        el.setPointerCapture(e.pointerId)
      }
      if (arrastrado) el.scrollLeft = left0 - dx
    }
    const up = (e: PointerEvent) => {
      if (!pulsado) return
      pulsado = false
      if (!arrastrado) return
      const paso = carouselStep(el)
      const dx = e.clientX - x0
      const desde = Math.round(left0 / paso)
      const hacia = dx < -paso * 0.15 ? desde + 1 : dx > paso * 0.15 ? desde - 1 : desde
      const ultimo = el.children.length - 1
      el.scrollTo({ left: Math.max(0, Math.min(ultimo, hacia)) * paso, behavior: 'smooth' })
      const encajar = () => {
        el.style.scrollSnapType = ''
      }
      el.addEventListener('scrollend', encajar, { once: true })
      setTimeout(encajar, 600)
    }
    // Tras arrastrar no se abre la tarjeta; y los enlaces no se arrastran como enlaces
    const click = (e: MouseEvent) => {
      if (!arrastrado) return
      e.preventDefault()
      e.stopPropagation()
      arrastrado = false
    }
    const dragstart = (e: DragEvent) => e.preventDefault()
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('click', click, true)
    el.addEventListener('dragstart', dragstart)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('click', click, true)
      el.removeEventListener('dragstart', dragstart)
    }
  }, [])
  return ref
}
