import { signal } from '@preact/signals'
import type { CatalogEntry, Level } from '../domain/catalog.ts'

export type RoutinesState =
  | { status: 'loading' }
  | {
      status: 'ready'
      profile: { daysPerWeek: number; level: Level } | null
      recommended: CatalogEntry[]
      alsoAllowed: CatalogEntry[]
      others: CatalogEntry[]
      adjusted: ReadonlySet<string>
      notice: string | null
      currentId: string | null
    }
  | { status: 'error' }

/** Rutinas que se enseñan en «Elige tu rutina». Solo las escriben los casos de uso. */
export const routines = signal<RoutinesState>({ status: 'loading' })

export type { CatalogEntry }

// Agrupar por familia (las pantallas no usan el dominio directamente)
export { FAMILIES, familySummary, groupByFamily, type FamilyGroup } from '../domain/families.ts'
export type { FamilyId } from '../domain/catalog.ts'
