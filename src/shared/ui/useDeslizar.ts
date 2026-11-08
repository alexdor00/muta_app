// Deslizar una fila a la izquierda para descubrir su botón (Eliminar, Quitar) y, si se pide, mantenerla pulsada para
// lo mismo. Lo usan la sesión de Entreno y las listas de Comida.
import { useEffect, useRef } from 'preact/hooks'

/** Lo que hay que mover una fila a la izquierda para que asome «Eliminar». */
export const ABRE = 42

/** Lo que hay que mantener pulsada una serie para borrarla. */
export const MANTENER_MS = 500

/**
 * Gestos de una fila: deslizarla a la izquierda (la sigue con el dedo y, al soltar, se queda abierta si pasó de la
 * mitad) o mantenerla pulsada medio segundo sin moverla (onMantener: se borra).
 */
export function useDeslizar(
  abierta: boolean,
  onAbrir: (abierta: boolean) => void,
  onMantener: (() => void) | null = null,
) {
  const ref = useRef<HTMLDivElement>(null)
  // La pantalla se repinta a menudo (el reloj): los escuchadores se ponen una vez y leen lo último de aquí
  const ultimoRef = useRef({ abierta, onAbrir, onMantener })
  useEffect(() => {
    ultimoRef.current = { abierta, onAbrir, onMantener }
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const base = () => (ultimoRef.current.abierta ? -ABRE * 2 : 0)
    let gesto: { x: number; y: number; dx: number; eje: 'x' | 'y' | null } | null = null
    let pulsado: ReturnType<typeof setTimeout> | undefined
    // Tras deslizar o mantener, el toque que suelta el dedo no cuenta (no abre el teclado ni marca la serie)
    let ignorarToque = false
    const soltarLuego = () => {
      ignorarToque = true
      setTimeout(() => {
        ignorarToque = false
      }, 0)
    }
    const down = (e: PointerEvent) => {
      gesto = { x: e.clientX, y: e.clientY, dx: 0, eje: null }
      clearTimeout(pulsado)
      if (!ultimoRef.current.onMantener) return
      pulsado = setTimeout(() => {
        if (!gesto || gesto.eje) return
        gesto = null
        soltarLuego()
        ultimoRef.current.onMantener?.()
      }, MANTENER_MS)
    }
    const move = (e: PointerEvent) => {
      if (!gesto) return
      const dx = e.clientX - gesto.x
      const dy = e.clientY - gesto.y
      if (!gesto.eje && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        gesto.eje = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        clearTimeout(pulsado)
        // Aunque el dedo salga de la fila, el gesto sigue siendo suyo
        if (gesto.eje === 'x') el.setPointerCapture(e.pointerId)
      }
      if (gesto.eje !== 'x') return
      gesto.dx = dx
      el.style.transform = `translateX(${Math.min(0, base() + dx)}px)`
    }
    const up = () => {
      clearTimeout(pulsado)
      if (ignorarToque) soltarLuego()
      const g = gesto
      gesto = null
      if (!g || g.eje !== 'x') return
      el.style.transform = ''
      soltarLuego()
      ultimoRef.current.onAbrir(base() + g.dx < -ABRE)
    }
    const click = (e: MouseEvent) => {
      if (!ignorarToque) return
      e.stopPropagation()
      e.preventDefault()
    }
    const cancel = () => {
      clearTimeout(pulsado)
      gesto = null
      el.style.transform = ''
    }
    // Soltar en cualquier sitio corta «mantener»: si algo se abre bajo el dedo (el teclado), el soltar no cae en la fila
    // (va después del soltar de la fila, que ya ha cerrado el deslizar)
    const soltarFuera = () => {
      clearTimeout(pulsado)
      gesto = null
    }
    document.addEventListener('pointerup', soltarFuera)
    document.addEventListener('pointercancel', soltarFuera)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', cancel)
    // Sin el menú de copiar que sale al mantener pulsado en el móvil
    const menu = (e: Event) => e.preventDefault()
    el.addEventListener('click', click, true)
    el.addEventListener('contextmenu', menu)
    return () => {
      clearTimeout(pulsado)
      document.removeEventListener('pointerup', soltarFuera)
      document.removeEventListener('pointercancel', soltarFuera)
      el.removeEventListener('contextmenu', menu)
      el.removeEventListener('click', click, true)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', cancel)
    }
  }, [])
  return ref
}
