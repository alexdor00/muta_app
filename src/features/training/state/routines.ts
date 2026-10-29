import { signal } from '@preact/signals'
import type { CatalogEntry, Level, Phase } from '../domain/catalog.ts'
import type { Category, CategoryId } from '../domain/categories.ts'
import type { ProgramInfo } from '../domain/programInfo.ts'
import type { Adaptation, PhaseView } from '../domain/routineView.ts'
import type { OptionalExercise, PriorityChoice } from '../domain/priorities.ts'
import type { WeakChoice, WeakTable } from '../domain/weakPoints.ts'

/** Una rutina lista para enseñar. */
export type RoutineItem = {
  entry: CatalogEntry
  info: ProgramInfo
  categories: CategoryId[]
  /** Encaja con tus días (o los más cercanos). */
  recommended: boolean
  /** Principiante con más de 4 días: elegible aunque no se recomiende. */
  allowed: boolean
  /** Las dos líneas grises de la fila. */
  lines: [string, string]
}

export type RoutinesState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready'
      profile: { daysPerWeek: number; level: Level; phase: Phase | null } | null
      notice: string | null
      /** Todas, ordenadas: primero las recomendadas, luego las elegibles, luego el resto. */
      items: RoutineItem[]
      featured: RoutineItem | null
      categories: { category: Category; count: number; forYou: number }[]
      saved: ReadonlySet<string>
      currentId: string | null
    }

/** Catálogo para «Elige tu rutina» y las categorías. Solo lo escriben los casos de uso. */
export const routines = signal<RoutinesState>({ status: 'loading' })

export type DetailState =
  | { status: 'loading' }
  | { status: 'missing' }
  | {
      status: 'ready'
      item: RoutineItem
      /** La rutina tal cual: el volumen solo lo ajustará el coach según cómo respondas. */
      phases: PhaseView[]
      weak: WeakView | null
      priorities: PriorityView | null
      /** Lo que has decidido de los opcionales y las prioridades. */
      choice: PriorityChoice | null
      /** Lo que dice el documento original sobre los días de descanso. */
      rest: string | null
    }

/** Prioridades de una rutina de MUTA: músculos, ejercicios opcionales y lo elegido. */
export type PriorityView = {
  muscles: string[]
  optionals: (OptionalExercise & { included: boolean; trimmed: boolean; reason: string | null })[]
  choice: PriorityChoice | null
  max: number
  /** Minutos por sesión que se aplican (75 por defecto); null = sin límite. */
  minutes: number | null
}

/** Punto débil de una rutina: la tabla y lo elegido. Nada es obligatorio. */
export type WeakView = {
  table: WeakTable
  choice: WeakChoice | null
}

/** Rutina abierta en detalle. */
export const routineDetail = signal<DetailState>({ status: 'loading' })

export { CATEGORIES } from '../domain/categories.ts'
export { aboutOf, type About } from '../domain/about.ts'
export type { WeakChoice, WeakTable } from '../domain/weakPoints.ts'
export type { Slot } from '../domain/slots.ts'
export type { PriorityChoice } from '../domain/priorities.ts'
export { DEFAULT_MINUTES, MAX_PRIORITIES } from '../domain/priorities.ts'
export type { Adaptation, Category, CategoryId, CatalogEntry, Level, PhaseView }
export {
  activeFilters,
  matches,
  restFact,
  weeksDiffer,
  withSuggestedRests,
  type Filters,
} from '../domain/routineView.ts'
export { SPLIT_LABEL, type Split, type VolumeTier } from '../domain/programInfo.ts'
