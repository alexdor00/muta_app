import type { CatalogEntry, FamilyId } from './catalog.ts'

// Tipos de entrenamiento: en «Elige tu rutina» se ve una tarjeta por familia.

export type Family = {
  id: FamilyId
  title: string
  /** Para quién es, en una línea. */
  description: string
  tone: 1 | 2 | 3 | 4 | 5 | 6
}

export const FAMILIES: Family[] = [
  {
    id: 'hipertrofia',
    title: 'Hipertrofia',
    description: 'Ganar músculo con volumen bien repartido',
    tone: 4,
  },
  {
    id: 'ppl',
    title: 'Empuje, tirón y pierna',
    description: 'Cada día un patrón: empuje, tirón o pierna',
    tone: 2,
  },
  {
    id: 'frecuencia',
    title: 'Frecuencia alta',
    description: 'Cuerpo completo varias veces por semana',
    tone: 5,
  },
  {
    id: 'fuerza',
    title: 'Fuerza e hipertrofia',
    description: 'Powerlifting y músculo: sentadilla, banca y peso muerto',
    tone: 6,
  },
  { id: 'gluteo', title: 'Glúteo y pierna', description: 'Énfasis en glúteo y tren inferior', tone: 3 },
  { id: 'esencial', title: 'Esencial 45 min', description: 'Sesiones cortas con lo imprescindible', tone: 3 },
  { id: 'base', title: 'Base', description: 'Para empezar con buena técnica', tone: 1 },
  { id: 'casa', title: 'En casa', description: 'Peso corporal, mancuernas y bandas', tone: 5 },
]

export type FamilyGroup = { family: Family; entries: CatalogEntry[] }

/** Agrupa rutinas por familia, en el orden en que aparece su primera rutina. */
export function groupByFamily(entries: CatalogEntry[]): FamilyGroup[] {
  const groups: FamilyGroup[] = []
  for (const entry of entries) {
    let group = groups.find((g) => g.family.id === entry.family)
    if (!group) {
      group = { family: FAMILIES.find((f) => f.id === entry.family)!, entries: [] }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
}

/** «3 opciones · 4–6 días» o, con una sola, su propio subtítulo. */
export function familySummary(entries: CatalogEntry[]): string {
  if (entries.length === 1) return entries[0].subtitle
  const days = [...new Set(entries.flatMap((e) => e.days))].sort((a, b) => a - b)
  const range = days.length === 1 ? `${days[0]}` : `${days[0]}–${days.at(-1)}`
  return `${entries.length} opciones · ${range} días`
}
