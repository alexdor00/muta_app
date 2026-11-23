// ¿Cómo estás hoy? (pestaña Hoy): cinco preguntas de un toque, los indicadores con los que la guía decide antes de tocar
// la dieta o el entreno (docs/conocimiento/04-guia-culturismo-natural.md: sueño, hambre, digestiones, energía y estrés).
// Se guardan por día y se ven en Progreso; nada cambia solo con ellas.

/** 0, 1 o 2: la primera, la del medio o la última opción de su pregunta. */
export type Respuesta = 0 | 1 | 2

export type PreguntaId = 'sueno' | 'energia' | 'hambre' | 'digestiones' | 'estres'

/** Lo que contestaste un día (una pregunta sin contestar no está). */
export type Sensaciones = { date: string } & Partial<Record<PreguntaId, Respuesta>>

type Tres = [string, string, string]

/**
 * Cada pregunta: cómo se pregunta, sus tres respuestas (con las palabras que pegan con ella) y cómo se dice cada una en
 * el resumen. Lo que se guarda es su número (0, 1 o 2): cambiar las palabras no cambia lo guardado.
 */
export const PREGUNTAS: {
  id: PreguntaId
  nombre: string
  pregunta: string
  opciones: Tres
  resumen: Tres
}[] = [
  {
    id: 'sueno',
    nombre: 'Sueño',
    pregunta: '¿Cuánto dormiste?',
    opciones: ['Menos de 6 h', '6–8 h', 'Más de 8 h'],
    resumen: ['menos de 6 h', '6–8 h', 'más de 8 h'],
  },
  {
    id: 'energia',
    nombre: 'Energía',
    pregunta: '¿Cómo vas de energía?',
    opciones: ['Sin fuerzas', 'Normal', 'Con energía'],
    resumen: ['baja', 'normal', 'alta'],
  },
  {
    id: 'hambre',
    nombre: 'Hambre',
    pregunta: '¿Cuánta hambre pasas?',
    opciones: ['Ninguna', 'La normal', 'Mucha'],
    resumen: ['poca', 'normal', 'mucha'],
  },
  {
    id: 'digestiones',
    nombre: 'Digestiones',
    pregunta: '¿Qué tal las digestiones?',
    opciones: ['Ligeras', 'Regular', 'Pesadas'],
    resumen: ['bien', 'regular', 'pesadas'],
  },
  {
    id: 'estres',
    nombre: 'Estrés',
    pregunta: '¿Cuánto estrés tienes?',
    opciones: ['Poco', 'Algo', 'Mucho'],
    resumen: ['poco', 'algo', 'mucho'],
  },
]

/** Cuántas preguntas contestaste. */
export function contestadas(s: Sensaciones | null | undefined): number {
  return s ? PREGUNTAS.filter((p) => s[p.id] !== undefined).length : 0
}

/** En una línea: «Sueño 6–8 h · energía alta · hambre poca…» (solo lo contestado); vacío si nada. */
export function resumenSensaciones(s: Sensaciones | null | undefined): string {
  if (!s) return ''
  return PREGUNTAS.filter((p) => s[p.id] !== undefined)
    .map((p, i) => {
      const nombre = i === 0 ? p.nombre : p.nombre.toLowerCase()
      return `${nombre} ${p.resumen[s[p.id]!]}`
    })
    .join(' · ')
}
