// Catálogo de rutinas: qué es cada programa y para quién encaja.

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Goal = 'gain_muscle' | 'lose_fat' | 'feel_better'

export type FamilyId =
  'hipertrofia' | 'ppl' | 'frecuencia' | 'fuerza' | 'gluteo' | 'esencial' | 'base' | 'casa'

export type CatalogEntry = {
  id: string
  /** Tipo de entrenamiento: las tarjetas se agrupan por familia. */
  family: FamilyId
  /** Título grande de la tarjeta. */
  title: string
  /** Línea pequeña: tipo de reparto y días. */
  subtitle: string
  /** Días por semana para los que está pensada (puede ser más de uno). */
  days: number[]
  levels: Level[]
  /** Aspecto de la tarjeta mientras no haya foto propia (1–6, ver tokens.css). */
  tone: 1 | 2 | 3 | 4 | 5 | 6
  /** Propias de MUTA (siempre disponibles) o locales (carpeta private/). */
  origin: 'muta' | 'local'
}

const ALL: Level[] = ['beginner', 'intermediate', 'advanced']
const MID: Level[] = ['intermediate', 'advanced']

export const CATALOG: CatalogEntry[] = [
  // Propias de MUTA (docs/conocimiento §8)
  {
    id: 'muta-cuerpo-completo-4d',
    family: 'hipertrofia',
    title: 'Cuerpo completo A/B',
    subtitle: 'Cuerpo completo · 4 días',
    days: [3, 4],
    levels: ALL,
    tone: 1,
    origin: 'muta',
  },
  {
    id: 'muta-ppl-6d',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Empuje, tirón y pierna · 6 días',
    days: [5, 6],
    levels: MID,
    tone: 2,
    origin: 'muta',
  },
  // Esencial 45 min
  {
    id: 'esencial-45min-2d',
    family: 'esencial',
    title: 'Esencial 45 min',
    subtitle: 'Cuerpo completo · 2 días',
    days: [2],
    levels: ALL,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-3d',
    family: 'esencial',
    title: 'Esencial 45 min',
    subtitle: 'Cuerpo completo, torso y pierna · 3 días',
    days: [3],
    levels: ALL,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-4d',
    family: 'esencial',
    title: 'Esencial 45 min',
    subtitle: 'Torso y pierna · 4 días',
    days: [4],
    levels: ALL,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-5d',
    family: 'esencial',
    title: 'Esencial 45 min',
    subtitle: 'Torso, pierna, empuje y tirón · 5 días',
    days: [5],
    levels: ALL,
    tone: 3,
    origin: 'local',
  },
  // Hipertrofia (dos fases)
  {
    id: 'hipertrofia-cuerpo-completo-5d-f1',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 1',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-cuerpo-completo-5d-f2',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 2',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-torso-pierna-f1',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 1',
    subtitle: 'Torso y pierna · 5 días',
    days: [4, 5],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-torso-pierna-f2',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 2',
    subtitle: 'Torso y pierna · 5 días',
    days: [4, 5],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-ppl-6d-f1',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 1',
    subtitle: 'Empuje, tirón y pierna · 6 días',
    days: [6],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-ppl-6d-f2',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 2',
    subtitle: 'Empuje, tirón y pierna · 6 días',
    days: [6],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  // Frecuencia alta
  {
    id: 'frecuencia-alta-cuerpo-completo-4d',
    family: 'frecuencia',
    title: 'Frecuencia alta',
    subtitle: 'Cuerpo completo · 4 días',
    days: [4],
    levels: MID,
    tone: 5,
    origin: 'local',
  },
  {
    id: 'frecuencia-alta-cuerpo-completo-5d',
    family: 'frecuencia',
    title: 'Frecuencia alta',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
    levels: MID,
    tone: 5,
    origin: 'local',
  },
  // Fuerza e hipertrofia
  {
    id: 'fuerza-hipertrofia-1-6d',
    family: 'fuerza',
    title: 'Fuerza e hipertrofia 1',
    subtitle: 'Cuerpo completo · 5–6 días',
    days: [5, 6],
    levels: MID,
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-2-4d',
    family: 'fuerza',
    title: 'Fuerza e hipertrofia 2',
    subtitle: 'Cuerpo completo · 4 días',
    days: [4],
    levels: MID,
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-2-6d',
    family: 'fuerza',
    title: 'Fuerza e hipertrofia 2',
    subtitle: 'Cuerpo completo · 5–6 días',
    days: [5, 6],
    levels: MID,
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-3-5d',
    family: 'fuerza',
    title: 'Fuerza e hipertrofia 3',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
    levels: ['advanced'],
    tone: 6,
    origin: 'local',
  },
  // Empuje, tirón y pierna completo (tres fases)
  {
    id: 'ppl-completo-4d',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Tres fases · 4 días',
    days: [4],
    levels: MID,
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-completo-5d',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Tres fases · 5 días',
    days: [5],
    levels: MID,
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-completo-6d',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Tres fases · 6 días',
    days: [6],
    levels: MID,
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-5d-editado',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Versión editada · 5 días',
    days: [5],
    levels: MID,
    tone: 2,
    origin: 'local',
  },
  // Programas que venían en PDF
  {
    id: 'mujer-base',
    family: 'base',
    title: 'Base',
    subtitle: 'Cuerpo completo, torso y pierna o por grupos · 3–5 días',
    days: [3, 4, 5],
    levels: ['beginner', 'intermediate'],
    tone: 1,
    origin: 'local',
  },
  {
    id: 'mujer-casa',
    family: 'casa',
    title: 'En casa',
    subtitle: 'Peso corporal, mancuernas y bandas · 3–4 días',
    days: [3, 4],
    levels: ALL,
    tone: 5,
    origin: 'local',
  },
  {
    id: 'gluteos',
    family: 'gluteo',
    title: 'Glúteo',
    subtitle: 'Especialización · 5 días',
    days: [5],
    levels: MID,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'mujer-especializacion',
    family: 'gluteo',
    title: 'Tren inferior',
    subtitle: 'Especialización · 6 días',
    days: [6],
    levels: MID,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'mujer-optimizacion',
    family: 'fuerza',
    title: 'Optimización',
    subtitle: 'Fuerza e hipertrofia · 5 días',
    days: [5],
    levels: ['advanced'],
    tone: 6,
    origin: 'local',
  },
]

/** A un principiante se le recomiendan como mucho 4 días y puede elegir hasta 5. */
export const BEGINNER_RECOMMENDED_DAYS = 4
export const BEGINNER_MAX_DAYS = 5

export type Recommendation = {
  recommended: CatalogEntry[]
  /** Principiante que pidió más de 4 días: las de 5, que puede elegir aunque no se recomienden. */
  alsoAllowed: CatalogEntry[]
  others: CatalogEntry[]
  /** Rutinas de nivel intermedio que se ajustan a principiante al elegirlas. */
  adjusted: ReadonlySet<string>
  /** Días con los que se ha buscado (puede ser menos de los elegidos). */
  targetDays: number
  /** Aviso cuando se buscan menos días de los elegidos. */
  notice: string | null
}

/** ¿Se ajusta esta rutina para este nivel? Solo las de intermedio cuando eres principiante. */
export function needsBeginnerAdjust(entry: CatalogEntry, level: Level): boolean {
  return level === 'beginner' && !entry.levels.includes('beginner') && entry.levels.includes('intermediate')
}

/**
 * Rutinas que encajan con lo elegido en la bienvenida: los mismos días por semana y el nivel.
 * - Principiante: como mucho 5 días (con aviso), y también las de intermedio, que se ajustan.
 * - Si ninguna encaja del todo, se recomiendan las del día más cercano.
 * - El resto va en «otras». Solo entran las disponibles (propias o cargadas en local).
 */
export function recommend(
  profile: { daysPerWeek: number; level: Level },
  available: ReadonlySet<string>,
): Recommendation {
  const beginner = profile.level === 'beginner'
  const targetDays = beginner ? Math.min(profile.daysPerWeek, BEGINNER_RECOMMENDED_DAYS) : profile.daysPerWeek
  const notice =
    targetDays < profile.daysPerWeek
      ? `Empezando, más días no es mejor: con ${targetDays} progresas igual y recuperas mejor. Si lo prefieres, puedes elegir una de ${BEGINNER_MAX_DAYS} como máximo.`
      : null

  const list = CATALOG.filter((entry) => entry.origin === 'muta' || available.has(entry.id))
  const fitsLevel = (entry: CatalogEntry) =>
    entry.levels.includes(profile.level) || needsBeginnerAdjust(entry, profile.level)
  const distance = (entry: CatalogEntry) => Math.min(...entry.days.map((d) => Math.abs(d - targetDays)))
  const candidates = list.filter(fitsLevel)
  const best = Math.min(...candidates.map(distance))
  // Primero las pensadas para tu nivel (las propias delante); al final las ajustadas.
  const rank = (entry: CatalogEntry) =>
    (needsBeginnerAdjust(entry, profile.level) ? 2 : 0) + (entry.origin === 'muta' ? 0 : 1)
  const byRank = (a: CatalogEntry, b: CatalogEntry) => rank(a) - rank(b)
  const recommended = candidates.filter((entry) => distance(entry) === best).sort(byRank)
  const alsoAllowed =
    beginner && profile.daysPerWeek > targetDays
      ? candidates
          .filter((entry) => !recommended.includes(entry) && entry.days.includes(BEGINNER_MAX_DAYS))
          .sort(byRank)
      : []
  const others = list.filter((entry) => !recommended.includes(entry) && !alsoAllowed.includes(entry))
  const adjusted = new Set(list.filter((e) => needsBeginnerAdjust(e, profile.level)).map((e) => e.id))
  return { recommended, alsoAllowed, others, adjusted, targetDays, notice }
}
