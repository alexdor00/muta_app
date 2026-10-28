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
  /** Aspecto de la tarjeta mientras no haya foto propia (1–6, ver tokens.css). */
  tone: 1 | 2 | 3 | 4 | 5 | 6
  /** Propias de MUTA (siempre disponibles) o locales (carpeta private/). */
  origin: 'muta' | 'local'
}

export const CATALOG: CatalogEntry[] = [
  // Propias de MUTA (docs/conocimiento §8)
  {
    id: 'muta-cuerpo-completo-4d',
    family: 'hipertrofia',
    title: 'Cuerpo completo A/B',
    subtitle: 'Cuerpo completo · 4 días',
    days: [3, 4],
    tone: 1,
    origin: 'muta',
  },
  {
    id: 'muta-ppl-6d',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Empuje, tirón y pierna · 6 días',
    days: [5, 6],
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
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-3d',
    family: 'esencial',
    title: 'Esencial 45 min',
    subtitle: 'Cuerpo completo, torso y pierna · 3 días',
    days: [3],
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-4d',
    family: 'esencial',
    title: 'Esencial 45 min',
    subtitle: 'Torso y pierna · 4 días',
    days: [4],
    tone: 3,
    origin: 'local',
  },
  {
    id: 'esencial-45min-5d',
    family: 'esencial',
    title: 'Esencial 45 min',
    subtitle: 'Torso, pierna, empuje y tirón · 5 días',
    days: [5],
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
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-cuerpo-completo-5d-f2',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 2',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-torso-pierna-f1',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 1',
    subtitle: 'Torso y pierna · 5 días',
    days: [4, 5],
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-torso-pierna-f2',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 2',
    subtitle: 'Torso y pierna · 5 días',
    days: [4, 5],
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-ppl-6d-f1',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 1',
    subtitle: 'Empuje, tirón y pierna · 6 días',
    days: [6],
    tone: 4,
    origin: 'local',
  },
  {
    id: 'hipertrofia-ppl-6d-f2',
    family: 'hipertrofia',
    title: 'Hipertrofia · Fase 2',
    subtitle: 'Empuje, tirón y pierna · 6 días',
    days: [6],
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
    tone: 5,
    origin: 'local',
  },
  {
    id: 'frecuencia-alta-cuerpo-completo-5d',
    family: 'frecuencia',
    title: 'Frecuencia alta',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
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
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-2-4d',
    family: 'fuerza',
    title: 'Fuerza e hipertrofia 2',
    subtitle: 'Cuerpo completo · 4 días',
    days: [4],
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-2-6d',
    family: 'fuerza',
    title: 'Fuerza e hipertrofia 2',
    subtitle: 'Cuerpo completo · 5–6 días',
    days: [5, 6],
    tone: 6,
    origin: 'local',
  },
  {
    id: 'fuerza-hipertrofia-3-5d',
    family: 'fuerza',
    title: 'Fuerza e hipertrofia 3',
    subtitle: 'Cuerpo completo · 5 días',
    days: [5],
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
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-completo-5d',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Tres fases · 5 días',
    days: [5],
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-completo-6d',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Tres fases · 6 días',
    days: [6],
    tone: 2,
    origin: 'local',
  },
  {
    id: 'ppl-5d-editado',
    family: 'ppl',
    title: 'Empuje, tirón y pierna',
    subtitle: 'Versión editada · 5 días',
    days: [5],
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
    tone: 1,
    origin: 'local',
  },
  {
    id: 'mujer-casa',
    family: 'casa',
    title: 'En casa',
    subtitle: 'Peso corporal, mancuernas y bandas · 3–4 días',
    days: [3, 4],
    tone: 5,
    origin: 'local',
  },
  {
    id: 'gluteos',
    family: 'gluteo',
    title: 'Glúteo',
    subtitle: 'Especialización · 5 días',
    days: [5],
    tone: 3,
    origin: 'local',
  },
  {
    id: 'mujer-especializacion',
    family: 'gluteo',
    title: 'Tren inferior',
    subtitle: 'Especialización · 6 días',
    days: [6],
    tone: 3,
    origin: 'local',
  },
  {
    id: 'mujer-optimizacion',
    family: 'fuerza',
    title: 'Optimización',
    subtitle: 'Fuerza e hipertrofia · 5 días',
    days: [5],
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
  /** Rutinas cuyo nivel medido no es el tuyo: se adaptan al elegirlas. */
  adjusted: ReadonlySet<string>
  /** Días con los que se ha buscado (puede ser menos de los elegidos). */
  targetDays: number
  /** Aviso cuando se buscan menos días de los elegidos. */
  notice: string | null
}

const ORDER: Level[] = ['beginner', 'intermediate', 'advanced']
/** Nivel medido de cada rutina (id → nivel). Lo carga el caso de uso desde shared/content. */
export type MeasuredLevels = Readonly<Record<string, Level>>

/** Volumen medido: mantenimiento o desarrollo (rangos «mantener» frente a «desarrollar»). */
export type MeasuredVolumes = Readonly<Record<string, 'maintain' | 'develop'>>

/** Fase del perfil: volumen, definición o mantenimiento (sale del objetivo). */
export type Phase = 'bulk' | 'cut' | 'maintenance'

/**
 * Nivel de la rutina medido por sus series semanales por músculo frente a los rangos de
 * docs/conocimiento (scripts/program-levels.ts → shared/content/program-levels.json, que pasa el caso de uso).
 */
export function levelOf(entry: CatalogEntry, measured: MeasuredLevels): Level {
  return measured[entry.id] ?? 'intermediate'
}

/** ¿Hay que adaptarla? Siempre que su nivel medido no sea el tuyo. */
export function needsAdjust(entry: CatalogEntry, level: Level, measured: MeasuredLevels): boolean {
  return levelOf(entry, measured) !== level
}

/**
 * Rutinas que encajan con lo elegido en la bienvenida (días y nivel).
 * - Cualquier rutina vale para cualquier nivel: si su nivel medido no es el tuyo, se adapta
 *   músculo a músculo al elegirla (domain/adaptVolume.ts).
 * - Principiante: se recomiendan como mucho 4 días (con aviso) y puede elegir hasta 5.
 * - Si ninguna es de tus días exactos, las del número de días más cercano.
 * - Orden: en definición y mantenimiento, primero las de volumen de mantenimiento (en volumen, al revés);
 *   después las de tu nivel (las de MUTA delante), después las adaptadas, de nivel más cercano a más lejano.
 * - El resto va en «otras». Solo entran las disponibles (propias o cargadas en local).
 */
export function recommend(
  profile: { daysPerWeek: number; level: Level; phase?: Phase },
  available: ReadonlySet<string>,
  measured: MeasuredLevels,
  volumes: MeasuredVolumes = {},
): Recommendation {
  const beginner = profile.level === 'beginner'
  const targetDays = beginner ? Math.min(profile.daysPerWeek, BEGINNER_RECOMMENDED_DAYS) : profile.daysPerWeek
  const notice =
    targetDays < profile.daysPerWeek
      ? `Empezando, más días no es mejor: con ${targetDays} progresas igual y recuperas mejor. Si lo prefieres, puedes elegir una de ${BEGINNER_MAX_DAYS} como máximo.`
      : null

  const list = CATALOG.filter((entry) => entry.origin === 'muta' || available.has(entry.id))
  const allowedDays = (entry: CatalogEntry) => !beginner || entry.days.some((d) => d <= BEGINNER_MAX_DAYS)
  const candidates = list.filter(allowedDays)
  const distance = (entry: CatalogEntry) => Math.min(...entry.days.map((d) => Math.abs(d - targetDays)))
  const best = Math.min(...candidates.map(distance))
  const levelGap = (entry: CatalogEntry) =>
    Math.abs(ORDER.indexOf(levelOf(entry, measured)) - ORDER.indexOf(profile.level))
  // En definición y mantenimiento van primero las de volumen de mantenimiento; en volumen, las de desarrollar.
  const wantsMaintain = profile.phase === 'cut' || profile.phase === 'maintenance'
  const phaseGap = (entry: CatalogEntry) =>
    profile.phase ? Number((volumes[entry.id] === 'maintain') !== wantsMaintain) : 0
  const rank = (entry: CatalogEntry) =>
    phaseGap(entry) * 4 + levelGap(entry) * 2 + (entry.origin === 'muta' ? 0 : 1)
  const byRank = (a: CatalogEntry, b: CatalogEntry) => rank(a) - rank(b)
  const recommended = candidates.filter((entry) => distance(entry) === best).sort(byRank)
  const alsoAllowed =
    beginner && profile.daysPerWeek > targetDays
      ? candidates
          .filter((entry) => !recommended.includes(entry) && entry.days.includes(BEGINNER_MAX_DAYS))
          .sort(byRank)
      : []
  const others = list.filter((entry) => !recommended.includes(entry) && !alsoAllowed.includes(entry))
  const adjusted = new Set(list.filter((e) => needsAdjust(e, profile.level, measured)).map((e) => e.id))
  return { recommended, alsoAllowed, others, adjusted, targetDays, notice }
}
