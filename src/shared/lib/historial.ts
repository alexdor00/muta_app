// Volver a la pantalla de antes (usuario, 2026-11-17: «dependiendo de dónde accedas, que te deje justo en la anterior»).
// Cada pantalla de MUTA apunta en su entrada del historial cuántas pantallas de MUTA tiene detrás (`apuntarPantalla`, al
// cambiar de pantalla). Si tiene alguna, «‹» vuelve atrás; si no (enlace directo o recarga), va a la de siempre. Antes se
// comparaba con el largo del historial, pero el navegador no pasa de 50 y, tras un rato de uso, «‹» siempre salía a la
// de siempre (usuario, 2026-11-19: «me manda a Nutrición»).

const CLAVE = 'mutaDetras'
const ALTURA = 'mutaAltura'
/** Las pantallas de MUTA detrás de la que se ve (−1: aún ninguna apuntada). */
let detras = -1
/**
 * Si la última navegación añadió una pantalla (pushState) o sustituyó la de antes (replaceState). No basta con el largo
 * del historial: al llegar a 50 deja de crecer y una pantalla nueva parecía sustituir a la de antes (usuario, 2026-11-19:
 * «desde una receta de Tu plan, ‹ me manda a Recetas»).
 */
let anadida = false
if (typeof window !== 'undefined') {
  const push = window.history.pushState.bind(window.history)
  const sustituir = window.history.replaceState.bind(window.history)
  window.history.scrollRestoration = 'manual'
  window.history.pushState = (...a: Parameters<History['pushState']>) => {
    // Antes de irte, la altura a la que estabas: al volver, se deja igual (usuario, 2026-11-19)
    const estado = window.history.state as Record<string, unknown> | null
    sustituir({ ...(estado ?? {}), [ALTURA]: window.scrollY }, '')
    anadida = true
    push(...a)
  }
}

/**
 * Apunta la pantalla que se ve: si ya lo estaba (al ir atrás o adelante), se lee; si es nueva, una más que la de antes; si
 * sustituye a la de antes (el historial no crece), las mismas.
 */
export function apuntarPantalla(): void {
  if (typeof window === 'undefined') return
  const estado = window.history.state as Record<string, unknown> | null
  const ya = estado?.[CLAVE]
  if (typeof ya === 'number') {
    detras = ya
    const y = estado?.[ALTURA]
    if (typeof y === 'number') volverALaAltura(y)
  } else {
    const nueva = anadida
    detras = detras < 0 ? 0 : nueva ? detras + 1 : detras
    window.history.replaceState({ ...(estado ?? {}), [CLAVE]: detras }, '')
  }
  anadida = false
}

/** Si hay una pantalla de MUTA detrás (se puede volver con el historial sin salir de la app). */
export const puedeVolver = (): boolean => detras > 0

/** Al volver, la misma altura; lo de la pantalla puede tardar en pintarse, así que se intenta durante un segundo. */
function volverALaAltura(y: number): void {
  const hasta = Date.now() + 1000
  const intentar = () => {
    window.scrollTo(0, y)
    if (Math.abs(window.scrollY - y) > 2 && Date.now() < hasta) requestAnimationFrame(intentar)
  }
  requestAnimationFrame(intentar)
}
