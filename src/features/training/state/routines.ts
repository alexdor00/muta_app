import { signal } from '@preact/signals'
import type { CatalogEntry, Level } from '../domain/catalog.ts'

export type RoutinesState =
  | { status: 'loading' }
  | {
      status: 'ready'
      profile: { daysPerWeek: number; level: Level } | null
      recommended: CatalogEntry[]
      others: CatalogEntry[]
      currentId: string | null
    }
  | { status: 'error' }

/** Rutinas que se enseñan en «Elige tu rutina». Solo las escriben los casos de uso. */
export const routines = signal<RoutinesState>({ status: 'loading' })
