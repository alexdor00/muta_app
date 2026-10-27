/**
 * 1RM estimado de una serie (motor.js · e1rm de la app actual).
 * Con kilos: kg × (1 + (reps + RIR) / 30). Sin kilos (peso corporal): reps + RIR.
 */
export function e1rm(kg: number | null, reps: number, rir: number): number {
  if (!kg) return reps + rir
  return kg * (1 + (reps + rir) / 30)
}
