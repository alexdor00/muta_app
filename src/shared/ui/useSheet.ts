import { useLocation } from 'preact-iso'

/**
 * Hoja como parámetro de la ruta (?hoja=descanso): el gesto atrás del móvil
 * cierra la hoja en vez de salir de la pantalla.
 */
export function useSheet(name: string) {
  const { path, query, route } = useLocation()
  const open = query.hoja === name

  function show() {
    const params = new URLSearchParams(query)
    params.set('hoja', name)
    route(`${path}?${params}`)
  }

  /** Abre esta hoja en lugar de la que está abierta: atrás vuelve a la pantalla, no a la otra hoja. */
  function showInstead() {
    const params = new URLSearchParams(query)
    params.set('hoja', name)
    route(`${path}?${params}`, true)
  }

  function close() {
    if (!open) return
    // Si la hoja se abrió desde la app, volver atrás la cierra. Si se entró con el enlace
    // directo, no hay nada atrás: se quita el parámetro sin salir de la pantalla.
    if (window.history.length > 1) window.history.back()
    else route(path, true)
  }

  return { open, show, showInstead, close }
}
