import type { ProgramInfo, Variant, VolumeTier } from './programInfo.ts'

// Catálogo de rutinas: datos de hecho de cada una (título, días, origen, variante).
// Todo lo demás (volumen, duración, reparto, ciclo, tipos) se mide: programInfo.ts y categories.ts.

export type Level = 'beginner' | 'intermediate' | 'advanced'
/** Fase del perfil: volumen, definición o mantenimiento (sale del objetivo). */
export type Phase = 'bulk' | 'cut' | 'maintenance'

export type CatalogEntry = {
  id: string
  title: string
  /** Días por semana para los que está escrita (puede ser más de uno). */
  days: number[]
  /** Aspecto de la miniatura y la cabecera mientras no haya foto propia (1–6). */
  tone: 1 | 2 | 3 | 4 | 5 | 6
  /** Propias de MUTA (siempre disponibles) o locales (carpeta private/). */
  origin: 'muta' | 'local'
  /** Archivo del que sale, si no es el mismo id (variantes de un programa con varias rutinas). */
  source?: string
  variant?: Variant
  /** Curada: programa para aprender técnica (no se puede medir con series). */
  foundation?: boolean
}

const local = (e: Omit<CatalogEntry, 'origin'>): CatalogEntry => ({ ...e, origin: 'local' })

export const CATALOG: CatalogEntry[] = [
  // Propias de MUTA (docs/conocimiento §8)
  { id: 'muta-cuerpo-completo-4d', title: 'Cuerpo completo A/B', days: [3, 4], tone: 1, origin: 'muta' },
  { id: 'muta-ppl-6d', title: 'Empuje, tirón y pierna', days: [5, 6], tone: 2, origin: 'muta' },
  // Esencial 45 min
  local({ id: 'esencial-45min-2d', title: 'Esencial · 2 días', days: [2], tone: 1 }),
  local({ id: 'esencial-45min-3d', title: 'Esencial · 3 días', days: [3], tone: 1 }),
  local({ id: 'esencial-45min-4d', title: 'Esencial · 4 días', days: [4], tone: 1 }),
  local({ id: 'esencial-45min-5d', title: 'Esencial · 5 días', days: [5], tone: 1 }),
  // Hipertrofia (dos fases)
  local({
    id: 'hipertrofia-cuerpo-completo-5d-f1',
    title: 'Hipertrofia F1 · cuerpo completo',
    days: [5],
    tone: 4,
  }),
  local({ id: 'hipertrofia-torso-pierna-f1', title: 'Hipertrofia F1 · torso y pierna', days: [5], tone: 4 }),
  local({
    id: 'hipertrofia-ppl-6d-f1',
    title: 'Hipertrofia F1 · empuje, tirón y pierna',
    days: [6],
    tone: 4,
  }),
  local({
    id: 'hipertrofia-cuerpo-completo-5d-f2',
    title: 'Hipertrofia F2 · cuerpo completo',
    days: [5],
    tone: 4,
  }),
  local({ id: 'hipertrofia-torso-pierna-f2', title: 'Hipertrofia F2 · torso y pierna', days: [5], tone: 4 }),
  local({
    id: 'hipertrofia-ppl-6d-f2',
    title: 'Hipertrofia F2 · empuje, tirón y pierna',
    days: [6],
    tone: 4,
  }),
  // Frecuencia alta
  local({ id: 'frecuencia-alta-cuerpo-completo-4d', title: 'Frecuencia alta · 4 días', days: [4], tone: 5 }),
  local({ id: 'frecuencia-alta-cuerpo-completo-5d', title: 'Frecuencia alta · 5 días', days: [5], tone: 5 }),
  // Fuerza e hipertrofia
  local({ id: 'fuerza-hipertrofia-1-6d', title: 'Fuerza e hipertrofia 1', days: [5, 6], tone: 6 }),
  local({ id: 'fuerza-hipertrofia-2-4d', title: 'Fuerza e hipertrofia 2 · 4 días', days: [4], tone: 6 }),
  local({ id: 'fuerza-hipertrofia-2-6d', title: 'Fuerza e hipertrofia 2 · 5–6 días', days: [5, 6], tone: 6 }),
  local({ id: 'fuerza-hipertrofia-3-5d', title: 'Fuerza e hipertrofia 3', days: [5], tone: 6 }),
  // Empuje, tirón y pierna en tres fases
  local({ id: 'ppl-completo-4d', title: 'PPL en 3 fases · 4 días', days: [4], tone: 2 }),
  local({ id: 'ppl-completo-5d', title: 'PPL en 3 fases · 5 días', days: [5], tone: 2 }),
  local({ id: 'ppl-completo-6d', title: 'PPL en 3 fases · 6 días', days: [6], tone: 2 }),
  local({ id: 'ppl-5d-editado', title: 'PPL · tu versión editada', days: [5], tone: 2 }),
  // Base: tres rutinas en un archivo (cada una con dos bloques de 4 semanas)
  local({
    id: 'base-3d',
    title: 'Base · cuerpo completo',
    days: [3],
    tone: 5,
    source: 'mujer-base',
    variant: { blocks: [0, 1] },
    foundation: true,
  }),
  local({
    id: 'base-4d',
    title: 'Base · torso y pierna',
    days: [4],
    tone: 5,
    source: 'mujer-base',
    variant: { blocks: [2, 3] },
    foundation: true,
  }),
  local({
    id: 'base-5d',
    title: 'Base · por grupos',
    days: [5],
    tone: 5,
    source: 'mujer-base',
    variant: { blocks: [4, 5] },
    foundation: true,
  }),
  // En casa: seis rutinas en un archivo (dos etapas de progresión)
  local({
    id: 'casa-peso-corporal',
    title: 'En casa · peso corporal',
    days: [3],
    tone: 2,
    source: 'mujer-casa',
    variant: { blocks: [0], sessions: '^Sesión' },
    foundation: true,
  }),
  local({
    id: 'casa-mancuernas',
    title: 'En casa · con mancuernas',
    days: [3],
    tone: 2,
    source: 'mujer-casa',
    variant: { blocks: [0], sessions: 'mancuernas' },
  }),
  local({
    id: 'casa-torso-pierna-1',
    title: 'En casa · torso y pierna, etapa 1',
    days: [4],
    tone: 2,
    source: 'mujer-casa',
    variant: { blocks: [1], sessions: 'Pierna|Torso' },
  }),
  local({
    id: 'casa-cuerpo-completo-1',
    title: 'En casa · cuerpo completo, etapa 1',
    days: [4],
    tone: 2,
    source: 'mujer-casa',
    variant: { blocks: [1], sessions: 'Cuerpo completo' },
  }),
  local({
    id: 'casa-torso-pierna-2',
    title: 'En casa · torso y pierna, etapa 2',
    days: [4],
    tone: 2,
    source: 'mujer-casa',
    variant: { blocks: [2], sessions: 'Pierna|Torso' },
  }),
  local({
    id: 'casa-cuerpo-completo-2',
    title: 'En casa · cuerpo completo, etapa 2',
    days: [4],
    tone: 2,
    source: 'mujer-casa',
    variant: { blocks: [2], sessions: 'Cuerpo completo' },
  }),
  // Especialización
  local({ id: 'gluteos', title: 'Glúteo', days: [5], tone: 3 }),
  local({ id: 'mujer-especializacion', title: 'Tren inferior', days: [6], tone: 3 }),
  local({ id: 'mujer-optimizacion', title: 'Optimización', days: [5], tone: 3 }),
]

/** Archivo del que sale la rutina. */
export const sourceOf = (entry: CatalogEntry) => entry.source ?? entry.id

/** A un principiante se le recomiendan como mucho 4 días y puede elegir hasta 5. */
export const BEGINNER_RECOMMENDED_DAYS = 4
export const BEGINNER_MAX_DAYS = 5

export type Recommendation = {
  /** De tus días, ordenadas: la primera es «Para ti». */
  recommended: CatalogEntry[]
  /** Principiante que pidió más de 4 días: las de 5, que puede elegir aunque no se recomienden. */
  alsoAllowed: CatalogEntry[]
  others: CatalogEntry[]
  /** Días con los que se ha buscado (puede ser menos de los elegidos). */
  targetDays: number
  /** Aviso cuando se buscan menos días de los elegidos. */
  notice: string | null
}

const TIER: Record<VolumeTier, number> = { bajo: 0, medio: 1, alto: 2 }

/**
 * Volumen que mejor te encaja (0 bajo, 1 medio, 2 alto): principiante 0,5, intermedio 1, avanzado 1,5;
 * en definición y mantenimiento medio punto menos (docs/conocimiento: en déficit no se sube volumen).
 */
export function targetTier(level: Level, phase?: Phase): number {
  const base = { beginner: 0.5, intermediate: 1, advanced: 1.5 }[level]
  return phase === 'cut' || phase === 'maintenance' ? base - 0.5 : base
}

/**
 * Rutinas recomendadas según la bienvenida (días, nivel y objetivo).
 * - De tus días (o del número de días más cercano). Principiante: hasta 4 recomendados y 5 elegibles.
 * - Orden: volumen más cercano al que te encaja; empate → propias de MUTA, luego gimnasio antes que casa.
 * - Cualquier rutina se puede elegir y adaptar después a tu nivel y objetivo con «Adaptar a mí».
 */
export function recommend(
  profile: { daysPerWeek: number; level: Level; phase?: Phase },
  available: ReadonlySet<string>,
  infos: Readonly<Record<string, Pick<ProgramInfo, 'volume' | 'equipment'>>>,
): Recommendation {
  const beginner = profile.level === 'beginner'
  const targetDays = beginner ? Math.min(profile.daysPerWeek, BEGINNER_RECOMMENDED_DAYS) : profile.daysPerWeek
  const notice =
    targetDays < profile.daysPerWeek
      ? `Empezando, más días no es mejor: con ${targetDays} progresas igual y recuperas mejor. Si lo prefieres, puedes elegir una de ${BEGINNER_MAX_DAYS} como máximo.`
      : null

  const list = CATALOG.filter((entry) => entry.origin === 'muta' || available.has(sourceOf(entry)))
  const candidates = list.filter((entry) => !beginner || entry.days.some((d) => d <= BEGINNER_MAX_DAYS))
  const distance = (entry: CatalogEntry) => Math.min(...entry.days.map((d) => Math.abs(d - targetDays)))
  const best = Math.min(...candidates.map(distance))
  const target = targetTier(profile.level, profile.phase)
  const rank = (entry: CatalogEntry) => {
    const info = infos[entry.id]
    const volumeGap = info ? Math.abs(TIER[info.volume] - target) : 1
    return volumeGap * 4 + (entry.origin === 'muta' ? 0 : 1) + (info?.equipment === 'home' ? 2 : 0)
  }
  const byRank = (a: CatalogEntry, b: CatalogEntry) => rank(a) - rank(b)
  const recommended = candidates.filter((entry) => distance(entry) === best).sort(byRank)
  const alsoAllowed =
    beginner && profile.daysPerWeek > targetDays
      ? candidates
          .filter((entry) => !recommended.includes(entry) && entry.days.includes(BEGINNER_MAX_DAYS))
          .sort(byRank)
      : []
  const others = list.filter((entry) => !recommended.includes(entry) && !alsoAllowed.includes(entry))
  return { recommended, alsoAllowed, others, targetDays, notice }
}
