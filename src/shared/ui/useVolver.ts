import { useLocation } from 'preact-iso'
import { puedeVolver } from '../lib/historial.ts'

/**
 * «‹»: a la pantalla de la que vienes (la de antes en el historial) o, si entraste directamente, a `porDefecto`. Lo usan
 * todas las barras con volver, así se vuelve igual en cualquier pantalla.
 */
export function useVolver(porDefecto: string): () => void {
  const { route } = useLocation()
  return () => (puedeVolver() ? window.history.back() : route(porDefecto))
}
