import type { MuscleId } from './muscles.ts'

// Dónde va el descanso obligatorio cuando el archivo no trae días de descanso: al completar la vuelta al cuerpo.
// El cuerpo se reparte en cuatro patrones y la vuelta se completa cuando las sesiones desde el último descanso
// los han trabajado todos, estén en una sesión o repartidos en varias («parte de la pierna, torso, la otra parte
// de la pierna»). Ejemplos de docs/conocimiento: A1, B1, descanso, A2, B2, descanso · EA, TA, PA, descanso, EB, TB, PB.

type Pattern = 'empuje' | 'tiron' | 'rodilla' | 'cadera'

const PATTERNS: Pattern[] = ['empuje', 'tiron', 'rodilla', 'cadera']

/** Qué patrón trabaja cada músculo. Abdomen, gemelo, antebrazo, aductores y cuello no cuentan: no completan el cuerpo. */
const PATTERN_OF: Partial<Record<MuscleId, Pattern>> = {
  pecho: 'empuje',
  hombro_ant: 'empuje',
  hombro_lat: 'empuje',
  triceps: 'empuje',
  dorsal: 'tiron',
  espalda_alta: 'tiron',
  hombro_post: 'tiron',
  biceps: 'tiron',
  cuadriceps: 'rodilla',
  femoral: 'cadera',
  gluteo: 'cadera',
}

/**
 * Las sesiones de una semana (sus músculos, en orden) → los números de sesión tras los que va un descanso (1 = tras la
 * primera). Va uno cada vez que se completa la vuelta al cuerpo y, si la semana acaba a medias, otro al final.
 */
export function restPositions(sessions: MuscleId[][]): number[] {
  const total = sessions.length
  const covered = new Set<Pattern>()
  const after: number[] = []
  sessions.forEach((muscles, i) => {
    for (const muscle of muscles) {
      const pattern = PATTERN_OF[muscle]
      if (pattern) covered.add(pattern)
    }
    if (PATTERNS.every((p) => covered.has(p))) {
      after.push(i + 1)
      covered.clear()
    }
  })
  if (total > 0 && after[after.length - 1] !== total) after.push(total)
  return after
}
