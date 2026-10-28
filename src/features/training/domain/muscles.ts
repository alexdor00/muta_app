// Grupos musculares y rangos de series semanales directas (docs/conocimiento: Parte I §3 y Parte II §2).

import type { Level } from './catalog.ts'

export type MuscleId =
  | 'pecho'
  | 'dorsal'
  | 'espalda_alta'
  | 'hombro_ant'
  | 'hombro_lat'
  | 'hombro_post'
  | 'biceps'
  | 'triceps'
  | 'antebrazo'
  | 'cuadriceps'
  | 'femoral'
  | 'gluteo'
  | 'aductores'
  | 'gemelo'
  | 'core'
  | 'cuello'

export type Range = [min: number, max: number]
export type Mode = 'maintain' | 'develop' | 'priority'

/** Rangos de nivel intermedio: mantener, desarrollar, prioridad. */
export const MUSCLES: Record<MuscleId, { label: string; maintain: Range; develop: Range; priority: Range }> =
  {
    pecho: { label: 'Pecho', maintain: [3, 5], develop: [6, 10], priority: [10, 16] },
    dorsal: { label: 'Dorsal', maintain: [2, 4], develop: [5, 9], priority: [8, 12] },
    espalda_alta: { label: 'Espalda alta', maintain: [2, 4], develop: [5, 9], priority: [8, 12] },
    hombro_ant: { label: 'Hombro anterior', maintain: [0, 5], develop: [2, 8], priority: [5, 10] },
    hombro_lat: { label: 'Hombro lateral', maintain: [4, 6], develop: [8, 12], priority: [12, 18] },
    hombro_post: { label: 'Hombro posterior', maintain: [0, 4], develop: [2, 8], priority: [6, 12] },
    biceps: { label: 'Bíceps', maintain: [3, 5], develop: [6, 10], priority: [10, 16] },
    triceps: { label: 'Tríceps', maintain: [3, 5], develop: [6, 10], priority: [10, 16] },
    antebrazo: { label: 'Antebrazo', maintain: [0, 3], develop: [0, 6], priority: [6, 10] },
    cuadriceps: { label: 'Cuádriceps', maintain: [4, 6], develop: [8, 12], priority: [12, 16] },
    femoral: { label: 'Femoral', maintain: [3, 5], develop: [6, 10], priority: [10, 12] },
    gluteo: { label: 'Glúteo', maintain: [3, 6], develop: [6, 12], priority: [10, 20] },
    aductores: { label: 'Aductores', maintain: [0, 4], develop: [2, 8], priority: [6, 10] },
    gemelo: { label: 'Gemelo', maintain: [3, 5], develop: [6, 10], priority: [10, 16] },
    core: { label: 'Abdomen', maintain: [2, 4], develop: [4, 8], priority: [6, 12] },
    cuello: { label: 'Cuello', maintain: [0, 3], develop: [2, 6], priority: [4, 8] },
  }

export const MUSCLE_IDS = Object.keys(MUSCLES) as MuscleId[]

/** Grupos grandes (Parte II §2). */
export const BIG: ReadonlySet<MuscleId> = new Set([
  'pecho',
  'dorsal',
  'espalda_alta',
  'hombro_lat',
  'biceps',
  'triceps',
  'cuadriceps',
  'femoral',
  'gluteo',
  'gemelo',
])

/**
 * Rango para un nivel (motor.js · levelRange):
 * - Principiante, desarrollar: grandes 4–8; resto mín × 0,6 y máx × 0,7 (máx ≥ 2); core 4–6.
 * - Principiante, prioridad: grandes 6–10; resto × 0,7 y × 0,75.
 * - Intermedio: la tabla.
 * - Avanzado, desarrollar: máx +2 grandes, +1 resto. Prioridad: mín +2 y máx +4 grandes; máx +2 resto.
 * - Mantener es igual para todos los niveles.
 */
export function rangeFor(muscle: MuscleId, level: Level, mode: Mode = 'develop'): Range {
  const base = MUSCLES[muscle][mode]
  const big = BIG.has(muscle)
  if (mode === 'maintain' || level === 'intermediate') return base
  if (level === 'beginner') {
    if (mode === 'develop') {
      if (muscle === 'core') return [4, 6]
      if (big) return [4, 8]
      return [Math.round(base[0] * 0.6), Math.max(2, Math.round(base[1] * 0.7))]
    }
    if (big) return [6, 10]
    return [Math.round(base[0] * 0.7), Math.round(base[1] * 0.75)]
  }
  if (mode === 'develop') return [base[0], base[1] + (big ? 2 : 1)]
  return big ? [base[0] + 2, base[1] + 4] : [base[0], base[1] + 2]
}
