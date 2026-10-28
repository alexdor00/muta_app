// Tipos de entrenamiento: la misma división que la carpeta de programas originales (un programa,
// una familia). Cada rutina pertenece a una sola, la de su archivo; el detalle (volumen, reparto,
// material…) se filtra después con los hechos medidos (programInfo.ts).

export type CategoryId =
  'muta' | 'culturismo' | 'frecuencia-alta' | 'ppl' | 'fuerza-hipertrofia' | 'fuerza' | 'esencial' | 'mujer'

export type Category = {
  id: CategoryId
  title: string
  /** Para quién es y qué tiene, en una frase (cabecera de la categoría). */
  description: string
  tone: 1 | 2 | 3 | 4 | 5 | 6
}

export const CATEGORIES: Category[] = [
  {
    id: 'muta',
    title: 'MUTA',
    description: 'Las rutinas propias de MUTA: sencillas, equilibradas y sin fecha de fin.',
    tone: 1,
  },
  {
    id: 'culturismo',
    title: 'Culturismo',
    description: 'Hipertrofia pura en dos fases: cuerpo completo, torso y pierna o empuje, tirón y pierna.',
    tone: 4,
  },
  {
    id: 'frecuencia-alta',
    title: 'Cuerpo completo · frecuencia alta',
    description: 'Todo el cuerpo en cada sesión, 4 o 5 días por semana, para ganar músculo.',
    tone: 5,
  },
  {
    id: 'ppl',
    title: 'Empuje, tirón y pierna',
    description: 'El reparto clásico en tres fases, de 4 a 6 días por semana.',
    tone: 2,
  },
  {
    id: 'fuerza-hipertrofia',
    title: 'Fuerza e hipertrofia',
    description:
      'Sentadilla, banca y peso muerto por porcentajes de tu máximo, con accesorios para el músculo.',
    tone: 6,
  },
  {
    id: 'fuerza',
    title: 'Fuerza',
    description: 'Especialización en un básico: subir tu sentadilla o tu press banca, con test al final.',
    tone: 6,
  },
  {
    id: 'esencial',
    title: 'Esencial · 45 min',
    description: 'Lo imprescindible: pocas series muy efectivas y sesiones de unos 45 minutos.',
    tone: 1,
  },
  {
    id: 'mujer',
    title: 'Mujer',
    description: 'Programas pensados para mujeres: base, glúteo, tren inferior, optimización y en casa.',
    tone: 3,
  },
]

/**
 * Rutinas especiales que el coach no ajusta: las esenciales (su poco volumen es intencionado).
 * En las de fuerza solo se ajustan los accesorios: los básicos por %1RM no se tocan (adaptVolume).
 */
export function isAdaptable(categories: CategoryId[]): boolean {
  return !categories.includes('esencial')
}
