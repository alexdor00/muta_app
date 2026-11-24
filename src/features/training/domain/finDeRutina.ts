// El final de una rutina (usuario, 2026-11-23): las que tienen semanas contadas (las del catálogo: de 4 a 13, a veces en
// fases) terminan al hacer la última sesión de su última semana; la app lo dice y propone repetirla o cambiar. Las de una
// sola semana que se repite (las de MUTA y las tuyas en CSV) no terminan nunca.
import type { ProgramData } from './program.ts'
import type { Rotacion } from './workoutPlan.ts'

/** Las semanas de una rutina, contando todas sus fases. */
export const semanasDelPrograma = (p: ProgramData): number => p.blocks.reduce((t, b) => t + b.weeks.length, 0)

/**
 * Si al hacer la sesión `hecha` (su puesto en la semana, de `n`) terminas la rutina: es la última de la última semana de su
 * última fase y la rutina tiene más de una semana.
 */
export function terminaLaRutina(p: ProgramData, rot: Rotacion, hecha: number, n: number): boolean {
  if (semanasDelPrograma(p) <= 1 || hecha < 0) return false
  const ultimaFase = rot.bloque === p.blocks.length - 1
  const ultimaSemana = rot.semana === (p.blocks[rot.bloque]?.weeks.length ?? 0) - 1
  return ultimaFase && ultimaSemana && hecha + 1 >= n
}
