// La foto de serie de cada sesión (cuando no pusiste la tuya): siete fotos, cada una de un tipo de sesión (pierna, empuje,
// tirón, brazos o cuerpo completo). Cada sesión coge al azar una de su tipo que no tenga otra; si no queda, cualquiera
// libre; y una vez elegida se guarda y no cambia (usuario, 2026-11-14).
import type { MuscleId } from './muscles.ts'

export type TipoSesion = 'pierna' | 'empuje' | 'tiron' | 'brazos' | 'completo'

/** Las fotos de serie (en `public/photos/sesiones/`), por tipo de sesión. */
export const FOTOS_DE_SERIE: Record<TipoSesion, readonly string[]> = {
  pierna: ['pierna-1', 'pierna-2'],
  empuje: ['empuje'],
  tiron: ['tiron'],
  brazos: ['brazos'],
  completo: ['completo-1', 'completo-2'],
}

const TODAS = Object.values(FOTOS_DE_SERIE).flat()

/** Dónde está una foto de serie. */
export const rutaFotoDeSerie = (foto: string) => `/photos/sesiones/${foto}.jpg`

/** A qué tipo empuja cada músculo (los de brazos y el abdomen se miran aparte). */
const GRUPO: Partial<Record<MuscleId, 'pierna' | 'empuje' | 'tiron'>> = {
  cuadriceps: 'pierna',
  femoral: 'pierna',
  gluteo: 'pierna',
  aductores: 'pierna',
  gemelo: 'pierna',
  pecho: 'empuje',
  hombro_ant: 'empuje',
  hombro_lat: 'empuje',
  triceps: 'empuje',
  dorsal: 'tiron',
  espalda_alta: 'tiron',
  hombro_post: 'tiron',
  biceps: 'tiron',
}
const BRAZOS: ReadonlySet<MuscleId> = new Set(['biceps', 'triceps', 'antebrazo'])

/**
 * El tipo de una sesión por sus series: brazos si la mitad o más son de bíceps, tríceps o antebrazo; si no, el grupo con
 * más series cuando pasa del 60 % (pierna, empuje o tirón); si ninguno manda, cuerpo completo. Sin series, completo.
 */
export function tipoDeSesion(
  ejercicios: readonly { musculo: MuscleId | null; series: number }[],
): TipoSesion {
  const total = ejercicios.reduce((n, e) => n + e.series, 0)
  if (!total) return 'completo'
  const de = (pasa: (m: MuscleId) => boolean) =>
    ejercicios.reduce((n, e) => n + (e.musculo && pasa(e.musculo) ? e.series : 0), 0)
  if (de((m) => BRAZOS.has(m)) / total >= 0.5) return 'brazos'
  const grupos = (['pierna', 'empuje', 'tiron'] as const).map((g) => ({ g, n: de((m) => GRUPO[m] === g) }))
  const mayor = grupos.reduce((a, b) => (b.n > a.n ? b : a))
  return mayor.n / total > 0.6 ? mayor.g : 'completo'
}

/**
 * La foto de cada sesión: las que ya tenían una (y sigue existiendo) la conservan; a las demás, al azar una de su tipo que
 * no use otra sesión; si no queda, cualquiera libre; si tampoco, una de su tipo aunque se repita.
 */
export function repartirFotos(
  sesiones: readonly { sigla: string; tipo: TipoSesion }[],
  guardadas: Readonly<Record<string, string>>,
  azar: () => number = Math.random,
): Record<string, string> {
  const fotos: Record<string, string> = {}
  for (const s of sesiones) if (TODAS.includes(guardadas[s.sigla])) fotos[s.sigla] = guardadas[s.sigla]
  const elige = (lista: readonly string[]) => lista[Math.floor(azar() * lista.length)]
  for (const s of sesiones) {
    if (fotos[s.sigla]) continue
    const usadas = new Set(Object.values(fotos))
    const deSuTipo = FOTOS_DE_SERIE[s.tipo].filter((f) => !usadas.has(f))
    const libres = TODAS.filter((f) => !usadas.has(f))
    fotos[s.sigla] = elige(deSuTipo.length ? deSuTipo : libres.length ? libres : FOTOS_DE_SERIE[s.tipo])
  }
  return fotos
}
