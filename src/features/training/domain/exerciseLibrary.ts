// Biblioteca de ejercicios: el contenido sale del prototipo anterior con scripts/exercises-from-prototype.cjs
// (campos de docs/conocimiento/03-migracion.md). Aquí, su forma, cómo se busca y cómo se comprueba.

import { plainText } from '../../../shared/lib/format.ts'
import { MUSCLE_IDS, MUSCLES, type MuscleId, type Range } from './muscles.ts'

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other'
export type Gym = 'gym' | 'basic' | 'home'

export type LibraryExercise = {
  id: string
  name: string
  primary: MuscleId
  /** Series que suma a cada músculo: 1 directa, 0,5 indirecta. */
  contributes: Partial<Record<MuscleId, number>>
  kind: 'compound' | 'isolation'
  equipment: Equipment
  pattern: string
  gyms: Gym[]
  reps: Range
  rir: number
  restSec: number
  stepKg: number
  heavy: boolean
  stable: boolean
  /** La clave de la técnica, con su fuente. */
  key: string
  source: string
  /**
   * Ejercicio original de una rutina (biblioteca local): `key` es la explicación de su documento y `source`, las
   * rutinas de las que sale.
   */
  deRutina?: boolean
  /** Si su documento no trae explicación: la web de la que sale `key` («strengthlog.com»). */
  keyWeb?: string
  /** Otros nombres con los que sale en las rutinas (la misma técnica con otra intensidad o tipo de serie). */
  alias?: string[]
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuerna',
  machine: 'Máquina',
  cable: 'Polea',
  bodyweight: 'Peso corporal',
  other: 'Otro',
}

/** Los que coinciden con lo escrito (sin tildes) y, si hay, con el músculo principal; en el orden de la biblioteca. */
export function searchLibrary(
  list: LibraryExercise[],
  query: string,
  muscle: MuscleId | null,
  /**
   * Cuántas veces sale cada ejercicio en las rutinas: los más típicos, primero (a igualdad, en el orden de la lista). Los
   * originales de las rutinas, siempre detrás de los de MUTA: algunos no se entienden sin su documento.
   */
  usos: Readonly<Record<string, number>> = {},
): LibraryExercise[] {
  const q = plainText(query.trim())
  return list
    .filter((e) => (!muscle || e.primary === muscle) && (!q || plainText(e.name).includes(q)))
    .map((e, i) => ({ e, i }))
    .sort(
      (a, b) =>
        Number(Boolean(a.e.deRutina)) - Number(Boolean(b.e.deRutina)) ||
        (usos[b.e.id] ?? 0) - (usos[a.e.id] ?? 0) ||
        a.i - b.i,
    )
    .map(({ e }) => e)
}

/** La línea de debajo del nombre: «Pecho, barra». */
export function libraryLine(e: LibraryExercise): string {
  return `${MUSCLES[e.primary].label}, ${EQUIPMENT_LABEL[e.equipment].toLowerCase()}`
}

/** Lo que está mal en la biblioteca (vacío si nada): id repetido, músculo que no existe, reps al revés. */
export function libraryProblems(list: LibraryExercise[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  const muscles = new Set<string>(MUSCLE_IDS)
  for (const e of list) {
    if (seen.has(e.id)) problems.push(`${e.id}: id repetido`)
    seen.add(e.id)
    if (!muscles.has(e.primary)) problems.push(`${e.id}: músculo «${e.primary}» desconocido`)
    for (const m of Object.keys(e.contributes))
      if (!muscles.has(m)) problems.push(`${e.id}: suma a «${m}», que no existe`)
    if (e.reps[0] > e.reps[1]) problems.push(`${e.id}: reps ${e.reps[0]}–${e.reps[1]} al revés`)
    if (!(e.equipment in EQUIPMENT_LABEL)) problems.push(`${e.id}: material «${e.equipment}» desconocido`)
  }
  return problems
}
