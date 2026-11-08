// Mapa de rutas de toda la app. Ninguna pantalla escribe una URL a mano: usa estas funciones.

export const paths = {
  welcome: '/bienvenida',
  /** A02–A04: pasos de la bienvenida (1, 2, 3). */
  onboarding: (step: number) => `/bienvenida/${step}`,
  today: '/hoy',
  training: '/entreno',
  routine: '/entreno/rutina',
  /** Ver una sesión de tu rutina (B1): progreso, ejercicios y «Empezar». */
  sessionView: (sessionId: string) => `/entreno/rutina/${sessionId}`,
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
  /** Ficha de un ejercicio de la biblioteca; desde la sesión en curso, con la sesión y el ejercicio al que volver. */
  exercise: (exerciseId: string, desde?: { sesion: string; ejercicio: number }) =>
    `/entreno/ejercicio/${exerciseId}${desde ? `?sesion=${desde.sesion}&ej=${desde.ejercicio}` : ''}`,
  nutrition: '/comida',
  /** Tu objetivo de comida: cómo sale, la revisión semanal del entrenador y el historial. */
  nutritionTarget: '/comida/objetivo',
  /** Una receta de tu dieta (`tipo`: la versión de entreno o la de descanso). */
  recipe: (id: string, tipo?: 'entreno' | 'descanso') => `/comida/receta/${id}${tipo ? `?tipo=${tipo}` : ''}`,
  /** La lista de la compra de tu dieta. */
  shopping: '/comida/compra',
  /** Cocina: el arroz, repartir una olla y calcular un plato. */
  kitchen: '/comida/cocina',
  /** La consulta semanal con tu dieta. */
  checkIn: '/comida/consulta',
  /** Los platos de una categoría del recetario. */
  dishes: (categoria: string) => `/comida/recetas/${categoria}`,
  /** Un plato del recetario o tuyo (para una comida de un día, si viene de ahí). */
  dish: (id: string, para?: { comida: string; fecha?: string }) =>
    `/comida/plato/${id}${para ? `?comida=${para.comida}${para.fecha ? `&fecha=${para.fecha}` : ''}` : ''}`,
  /** Tu nutricionista: lo que propone para tu menú. */
  nutritionist: '/comida/nutricionista',
  progress: '/progreso',
  profile: '/perfil',
} as const

// Patrones para el router (mismas rutas, con parámetros).
export const patterns = {
  onboarding: '/bienvenida/:step',
  routineCategory: '/entreno/rutinas/:category',
  routineSection: '/entreno/rutinas/:category/:section',
  routineDetail: '/entreno/programa/:id',
  sessionView: '/entreno/rutina/:sessionId',
  sessionStart: '/entreno/sesion/:sessionId/inicio',
  session: '/entreno/sesion/:sessionId',
  summary: '/entreno/sesion/:sessionId/resumen',
  exercise: '/entreno/ejercicio/:exerciseId',
  recipe: '/comida/receta/:id',
  dishes: '/comida/recetas/:categoria',
  dish: '/comida/plato/:id',
} as const

export type Tab = 'today' | 'training' | 'nutrition' | 'progress'

export const tabs: { id: Tab; label: string; path: string }[] = [
  { id: 'today', label: 'Hoy', path: paths.today },
  { id: 'training', label: 'Entreno', path: paths.training },
  { id: 'nutrition', label: 'Nutrición', path: paths.nutrition },
  { id: 'progress', label: 'Progreso', path: paths.progress },
]

/** Pestaña a la que pertenece una ruta, o null si no tiene (bienvenida, perfil). */
export function tabOf(path: string): Tab | null {
  const found = tabs.find((tab) => path === tab.path || path.startsWith(`${tab.path}/`))
  return found ? found.id : null
}

/**
 * Pantalla completa, sin barra de pestañas: la bienvenida, ver una sesión (lleva «Empezar» fijo abajo), la ficha de un
 * ejercicio y las pantallas de Comida que salen de la pestaña (Tu objetivo, una receta, la compra, la cocina y la consulta:
 * llevan su propia flecha atrás) y entrenar
 * (sesión en curso y resumen), para no salir por error. La sesión antes de empezar (inicio) sí lleva pestañas.
 */
export function isFullScreen(path: string): boolean {
  if (path === paths.welcome || path.startsWith(`${paths.welcome}/`)) return true
  if (path.startsWith(`${paths.routine}/`) || path.startsWith('/entreno/ejercicio/')) return true
  if (path.startsWith(`${paths.nutrition}/`)) return true
  return /^\/entreno\/sesion\/[^/]+(\/resumen)?\/?$/.test(path)
}
