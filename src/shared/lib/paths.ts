// Mapa de rutas de toda la app. Ninguna pantalla escribe una URL a mano: usa estas funciones.

export const paths = {
  welcome: '/bienvenida',
  today: '/hoy',
  training: '/entreno',
  routine: '/entreno/rutina',
  sessionStart: (sessionId: string) => `/entreno/sesion/${sessionId}/inicio`,
  session: (sessionId: string) => `/entreno/sesion/${sessionId}`,
  summary: (sessionId: string) => `/entreno/sesion/${sessionId}/resumen`,
  exercise: (exerciseId: string) => `/entreno/ejercicio/${exerciseId}`,
  nutrition: '/comida',
  progress: '/progreso',
  profile: '/perfil',
} as const

// Patrones para el router (mismas rutas, con parámetros).
export const patterns = {
  sessionStart: '/entreno/sesion/:sessionId/inicio',
  session: '/entreno/sesion/:sessionId',
  summary: '/entreno/sesion/:sessionId/resumen',
  exercise: '/entreno/ejercicio/:exerciseId',
} as const

export type Tab = 'today' | 'training' | 'nutrition' | 'progress'

export const tabs: { id: Tab; label: string; path: string }[] = [
  { id: 'today', label: 'Hoy', path: paths.today },
  { id: 'training', label: 'Entreno', path: paths.training },
  { id: 'nutrition', label: 'Comida', path: paths.nutrition },
  { id: 'progress', label: 'Progreso', path: paths.progress },
]

/** Pestaña a la que pertenece una ruta, o null si no tiene (bienvenida, perfil). */
export function tabOf(path: string): Tab | null {
  const found = tabs.find((tab) => path === tab.path || path.startsWith(`${tab.path}/`))
  return found ? found.id : null
}

/**
 * Entrenar va a pantalla completa, sin barra de pestañas, para no salir por error:
 * la sesión en curso y el resumen. La sesión antes de empezar (inicio) sí la lleva.
 */
export function isFullScreen(path: string): boolean {
  return /^\/entreno\/sesion\/[^/]+(\/resumen)?\/?$/.test(path)
}
