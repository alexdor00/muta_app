// Tus récords y tu calendario (prototipo: progreso/progreso.js · pvRecords y pvCal): el récord del básico de cada grupo
// muscular, de todos tus entrenos.
import { mejorDe } from './mesocycles.ts'
import type { MuscleId } from './muscles.ts'
import type { Entreno } from './workoutHistory.ts'
import type { SerieHecha } from './workoutSet.ts'

/** Los grupos de «Récords» (prototipo: progreso.js · PV_REC). */
export const GRUPOS_RECORDS: { id: string; nombre: string; musculos: MuscleId[] }[] = [
  { id: 'pecho', nombre: 'Pecho', musculos: ['pecho'] },
  { id: 'espalda', nombre: 'Espalda', musculos: ['dorsal', 'espalda_alta'] },
  { id: 'hombros', nombre: 'Hombros', musculos: ['hombro_ant', 'hombro_lat', 'hombro_post'] },
  { id: 'biceps', nombre: 'Bíceps', musculos: ['biceps'] },
  { id: 'triceps', nombre: 'Tríceps', musculos: ['triceps'] },
  { id: 'cuadriceps', nombre: 'Cuádriceps', musculos: ['cuadriceps'] },
  { id: 'femoral', nombre: 'Femoral', musculos: ['femoral'] },
  { id: 'gluteo', nombre: 'Glúteo', musculos: ['gluteo'] },
  { id: 'gemelo', nombre: 'Gemelo', musculos: ['gemelo'] },
  { id: 'core', nombre: 'Abdomen', musculos: ['core'] },
]

export type RecordGrupo = {
  grupo: string
  nombre: string
  /** El básico (el que elegiste o el que más repites) y si lo elegiste tú; null si aún no hay ninguno. */
  basico: string | null
  elegido: boolean
  /** Su mejor serie de siempre (por 1RM estimado), su 1RM y cuándo; null si aún no lo has hecho. */
  serie: SerieHecha | null
  e1rm: number | null
  fecha: string | null
  /** Los ejercicios de ese grupo que has hecho (para cambiar el básico). */
  hechos: string[]
}

/**
 * El récord del básico de cada grupo, de todos tus entrenos: el que elegiste o, si no, el que más repites de ese grupo
 * (primero los compuestos; a igualdad, el de más 1RM).
 */
export function recordsPorGrupo(
  entrenos: readonly Entreno[],
  elegidos: Readonly<Record<string, string>>,
  musculoDe: (nombre: string, guardado: MuscleId | null) => MuscleId | null,
  esCompuesto: (nombre: string) => boolean,
): RecordGrupo[] {
  const por = new Map<
    string,
    { veces: number; mejor: number; serie: SerieHecha | null; fecha: string; musculo: MuscleId | null }
  >()
  for (const x of [...entrenos].sort((a, b) => a.inicio - b.inicio))
    for (const e of x.ejercicios) {
      const { valor, serie } = mejorDe(e)
      if (!valor) continue
      const o = por.get(e.nombre) ?? {
        veces: 0,
        mejor: 0,
        serie: null,
        fecha: '',
        musculo: musculoDe(e.nombre, e.musculo),
      }
      o.veces++
      if (valor > o.mejor) Object.assign(o, { mejor: valor, serie, fecha: x.fecha })
      por.set(e.nombre, o)
    }
  return GRUPOS_RECORDS.map((g) => {
    const hechos = [...por.entries()]
      .filter(([, o]) => o.musculo && g.musculos.includes(o.musculo))
      .sort(
        ([a, x], [b, y]) =>
          Number(esCompuesto(b)) - Number(esCompuesto(a)) || y.veces - x.veces || y.mejor - x.mejor,
      )
      .map(([n]) => n)
    const elegido = elegidos[g.id] ?? null
    const basico = elegido ?? hechos[0] ?? null
    const r = basico ? por.get(basico) : undefined
    return {
      grupo: g.id,
      nombre: g.nombre,
      basico,
      elegido: Boolean(elegido),
      serie: r?.serie ?? null,
      e1rm: r ? Math.round(r.mejor * 10) / 10 : null,
      fecha: r?.fecha ?? null,
      hechos,
    }
  })
}
