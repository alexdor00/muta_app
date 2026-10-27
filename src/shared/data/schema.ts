// Almacenes de la base de datos (tabla «Almacenes e índices» del documento de rediseño).

export const DB_NAME = 'muta'

export type StoreName =
  | 'workouts'
  | 'exerciseHistory'
  | 'plans'
  | 'rotation'
  | 'mesocycles'
  | 'profile'
  | 'bodyLog'
  | 'foodLog'
  | 'coach'
  | 'userContent'
  | 'photos'
  | 'meta'
  | 'programs'

type StoreDef = { keyPath: string | string[]; indexes?: Record<string, string | string[]> }

export const STORES: Record<StoreName, StoreDef> = {
  workouts: { keyPath: 'id', indexes: { date: 'date', status: 'status' } },
  exerciseHistory: { keyPath: ['exerciseId', 'date'], indexes: { exerciseId: 'exerciseId' } },
  plans: { keyPath: 'id' },
  rotation: { keyPath: 'id' }, // un único registro con id 'current'
  mesocycles: { keyPath: 'id', indexes: { startDate: 'startDate' } },
  profile: { keyPath: 'id' }, // un único registro con id 'me'
  bodyLog: { keyPath: ['date', 'type'], indexes: { type: 'type' } },
  foodLog: { keyPath: 'date' },
  coach: { keyPath: 'id', indexes: { status: 'status' } },
  userContent: { keyPath: 'id', indexes: { target: 'target' } },
  photos: { keyPath: 'id', indexes: { date: 'date' } },
  meta: { keyPath: 'key' }, // versión del esquema, última copia, registro de errores
  programs: { keyPath: 'id' }, // programas de entrenamiento (plantillas completas por semanas)
}

/** Almacenes que crea cada migración. La 1 crea todos los demás. */
export const STORES_ADDED_IN: Partial<Record<number, StoreName[]>> = { 2: ['programs'] }

export const STORE_NAMES = Object.keys(STORES) as StoreName[]

/** Estado de un entreno en el almacén workouts (índice status). */
export const WORKOUT_STATUS = { inProgress: 'in_progress', finished: 'finished' } as const
