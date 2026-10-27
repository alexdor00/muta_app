// Catálogo de rutinas: qué es cada programa y para quién encaja.

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Goal = 'gain_muscle' | 'lose_fat' | 'feel_better'

export type CatalogEntry = {
  id: string
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
    title: 'Cuerpo completo A/B',
    subtitle: 'Cuerpo completo · 4 días',
    days: [3, 4],
    levels: ALL,
    tone: 1,
    origin: 'muta',
  },
  {
    id: 'muta-ppl-6d',
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
    title: 'Esencial 45 min',
    subtitle: 'Cuerpo completo · 2 días',
    days: [2],
    levels: ALL,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-3d',
    title: 'Esencial 45 min',
    subtitle: 'Cuerpo completo, torso y pierna · 3 días',
    days: [3],
    levels: ALL,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-4d',
    title: 'Esencial 45 min',
    subtitle: 'Torso y pierna · 4 días',
    days: [4],
    levels: ALL,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-5d',
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
    title: 'Hipertrofia · Fase 1',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-cuerpo-completo-5d-f2',
    title: 'Hipertrofia · Fase 2',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-torso-pierna-f1',
    title: 'Hipertrofia · Fase 1',
    subtitle: 'Torso y pierna · 5 días',
    days: [4, 5],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-torso-pierna-f2',
    title: 'Hipertrofia · Fase 2',
    subtitle: 'Torso y pierna · 5 días',
    days: [4, 5],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-ppl-6d-f1',
    title: 'Hipertrofia · Fase 1',
    subtitle: 'Empuje, tirón y pierna · 6 días',
    days: [6],
    levels: MID,
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-ppl-6d-f2',
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
    title: 'Frecuencia alta',
    subtitle: 'Cuerpo completo · 4 días',
    days: [4],
    levels: MID,
    tone: 5,
    origin: 'local',
  },
  {
    id: 'frecuencia-alta-cuerpo-completo-5d',
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
    title: 'Fuerza e hipertrofia 1',
    subtitle: 'Cuerpo completo · 5–6 días',
    days: [5, 6],
    levels: MID,
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-2-4d',
    title: 'Fuerza e hipertrofia 2',
    subtitle: 'Cuerpo completo · 4 días',
    days: [4],
    levels: MID,
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-2-6d',
    title: 'Fuerza e hipertrofia 2',
    subtitle: 'Cuerpo completo · 5–6 días',
    days: [5, 6],
    levels: MID,
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-3-5d',
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
    title: 'Empuje, tirón y pierna',
    subtitle: 'Tres fases · 4 días',
    days: [4],
    levels: MID,
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-completo-5d',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Tres fases · 5 días',
    days: [5],
    levels: MID,
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-completo-6d',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Tres fases · 6 días',
    days: [6],
    levels: MID,
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-5d-editado',
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
    title: 'Base',
    subtitle: 'Cuerpo completo, torso y pierna o por grupos · 3–5 días',
    days: [3, 4, 5],
    levels: ['beginner', 'intermediate'],
    tone: 1,
    origin: 'local',
  },
  {
    id: 'mujer-casa',
    title: 'En casa',
    subtitle: 'Peso corporal, mancuernas y bandas · 3–4 días',
    days: [3, 4],
    levels: ALL,
    tone: 5,
    origin: 'local',
  },
  {
    id: 'gluteos',
    title: 'Glúteo',
    subtitle: 'Especialización · 5 días',
    days: [5],
    levels: MID,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'mujer-especializacion',
    title: 'Tren inferior',
    subtitle: 'Especialización · 6 días',
    days: [6],
    levels: MID,
    tone: 3,
    origin: 'local',
  },
  {
    id: 'mujer-optimizacion',
    title: 'Optimización',
    subtitle: 'Fuerza e hipertrofia · 5 días',
    days: [5],
    levels: ['advanced'],
    tone: 6,
    origin: 'local',
  },
]

export type Recommendation = { recommended: CatalogEntry[]; others: CatalogEntry[] }

/**
 * Rutinas que encajan con lo elegido en la bienvenida: los mismos días por semana y el nivel.
 * Si ninguna encaja del todo, se recomiendan las del día más cercano. El resto va en «Otras».
 * Solo entran las que estén disponibles (propias o cargadas en local).
 */
export function recommend(
  profile: { daysPerWeek: number; level: Level },
  available: ReadonlySet<string>,
): Recommendation {
  const list = CATALOG.filter((entry) => entry.origin === 'muta' || available.has(entry.id))
  const fitsLevel = (entry: CatalogEntry) => entry.levels.includes(profile.level)
  const distance = (entry: CatalogEntry) =>
    Math.min(...entry.days.map((d) => Math.abs(d - profile.daysPerWeek)))
  const candidates = list.filter(fitsLevel)
  const best = Math.min(...candidates.map(distance))
  const recommended = candidates
    .filter((entry) => distance(entry) === best)
    .sort((a, b) => Number(b.origin === 'muta') - Number(a.origin === 'muta'))
  const others = list.filter((entry) => !recommended.includes(entry))
  return { recommended, others }
}
