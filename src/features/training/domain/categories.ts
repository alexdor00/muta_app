import type { ProgramInfo } from './programInfo.ts'

// Tipos de entrenamiento. Cada rutina entra en los que cumpla (puede ser más de uno).
// Las reglas usan hechos medidos (programInfo.ts); solo «primeros pasos» es curación (intención
// del programa: aprender técnica), porque no se puede medir con series.

export type CategoryId = 'hipertrofia' | 'fuerza' | 'gluteo' | 'minimalista' | 'primeros-pasos' | 'casa'

export type Category = {
  id: CategoryId
  title: string
  /** Para quién es y qué tiene, en una frase (cabecera de la categoría). */
  description: string
  tone: 1 | 2 | 3 | 4 | 5 | 6
}

export const CATEGORIES: Category[] = [
  {
    id: 'hipertrofia',
    title: 'Hipertrofia',
    description:
      'Ganar músculo con el volumen bien repartido entre todos los grupos y series cerca del fallo.',
    tone: 4,
  },
  {
    id: 'fuerza',
    title: 'Fuerza e hipertrofia',
    description:
      'Sentadilla, banca y peso muerto por porcentajes de tu máximo, con accesorios para el músculo.',
    tone: 6,
  },
  {
    id: 'gluteo',
    title: 'Glúteo y pierna',
    description: 'Especialización: más series para glúteo y tren inferior sin descuidar el resto.',
    tone: 3,
  },
  {
    id: 'minimalista',
    title: 'Minimalista',
    description: 'Lo imprescindible: pocas series muy efectivas y sesiones de unos 45 minutos.',
    tone: 1,
  },
  {
    id: 'primeros-pasos',
    title: 'Primeros pasos',
    description: 'Aprende los movimientos básicos con buena técnica y una progresión sencilla.',
    tone: 5,
  },
  {
    id: 'casa',
    title: 'En casa',
    description: 'Peso corporal, mancuernas y bandas: sin máquinas ni poleas.',
    tone: 2,
  },
]

/** Parte mínima de las series por %1RM para que una rutina sea de fuerza. */
export const STRENGTH_SHARE = 0.12
/** Minimalista: como mucho estas series por ejercicio y estos minutos por sesión. */
export const MINIMAL_SETS = 2
export const MINIMAL_MINUTES = 50

/**
 * Tipos de una rutina:
 * - En casa: sin barras, máquinas ni poleas.
 * - Primeros pasos: curada (programas de técnica).
 * - Minimalista: gimnasio, ≤ 2 series por ejercicio y ≤ 50 min por sesión.
 * - Fuerza e hipertrofia: ≥ 12 % de las series por %1RM.
 * - Glúteo y pierna: el glúteo es músculo prioritario de la rutina.
 * - Hipertrofia: gimnasio y ninguna de las anteriores (salvo casa/primeros pasos, que no aplican).
 */
export function categorize(info: ProgramInfo, curated: { foundation?: boolean } = {}): CategoryId[] {
  const out: CategoryId[] = []
  if (info.equipment === 'home') out.push('casa')
  if (curated.foundation) out.push('primeros-pasos')
  const minimal =
    info.equipment === 'gym' && info.setsPerExercise <= MINIMAL_SETS && info.minutes <= MINIMAL_MINUTES
  if (minimal) out.push('minimalista')
  const strength = info.strengthShare >= STRENGTH_SHARE
  if (strength) out.push('fuerza')
  const glute = info.emphasis.includes('gluteo')
  if (glute) out.push('gluteo')
  if (info.equipment === 'gym' && !minimal && !strength && !glute && !curated.foundation)
    out.push('hipertrofia')
  return out.length ? out : ['hipertrofia']
}
