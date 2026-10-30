// Mapa de rutas de toda la app. Ninguna pantalla escribe una URL a mano: usa estas funciones.

export const paths = {
  welcome: '/bienvenida',
  /** A02–A04: pasos de la bienvenida (1, 2, 3). */
  onboarding: (step: number) => `/bienvenida/${step}`,
  today: '/hoy',
  training: '/entreno',
  routine: '/entreno/rutina',
  /** Elegir rutina (tras la bienvenida, o para cambiarla). */
  chooseRoutine: '/entreno/rutinas',
  /** Rutinas de un tipo de entrenamiento («guardadas» = las marcadas). */
  routineCategory: (category: string) => `/entreno/rutinas/${category}`,
  /** Una sección de un tipo («mujer» → «base»), o «todas» para la lista completa. */
  routineSection: (category: string, section: string) => `/entreno/rutinas/${category}/${section}`,
  /** Detalle de una rutina, con «Adaptar a mí» y «Empezar esta rutina». */
  routineDetail: (id: string) => `/entreno/programa/${id}`,
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
  onboarding: '/bienvenida/:step',
  routineCategory: '/entreno/rutinas/:category',
  routineSection: '/entreno/rutinas/:category/:section',
  routineDetail: '/entreno/programa/:id',
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
 * Pantalla completa, sin barra de pestañas: la bienvenida y entrenar (sesión en curso y resumen),
 * para no salir por error. La sesión antes de empezar (inicio) sí lleva pestañas.
 */
export function isFullScreen(path: string): boolean {
  if (path === paths.welcome || path.startsWith(`${paths.welcome}/`)) return true
  return /^\/entreno\/sesion\/[^/]+(\/resumen)?\/?$/.test(path)
}
