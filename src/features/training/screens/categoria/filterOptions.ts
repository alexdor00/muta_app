import { SPLIT_LABEL, type Split } from '../../state/routines.ts'

// Opciones de la hoja de filtros de una categoría (el valor «todos» quita el filtro).

export const ALL = 'todos'
export type Option = { value: string; label: string }
export const DAY_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  ...[2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: `${d} días` })),
]
export const SPLIT_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  ...(Object.keys(SPLIT_LABEL) as Split[]).map((s) => ({ value: s, label: SPLIT_LABEL[s] })),
]
export const EQUIPMENT_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  { value: 'gym', label: 'Gimnasio' },
  { value: 'home', label: 'En casa' },
]
export const DURATION_OPTIONS: Option[] = [
  { value: ALL, label: 'Todas' },
  { value: 'corta', label: 'Hasta 45 min' },
  { value: 'media', label: '50–65 min' },
  { value: 'larga', label: '70 min o más' },
]
export const VOLUME_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
]
export const BASICS_OPTIONS: Option[] = [
  { value: ALL, label: 'Todas' },
  { value: 'si', label: 'Mejoran los básicos' },
]
export const CYCLE_OPTIONS: Option[] = [
  { value: ALL, label: 'Todos' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'rota', label: 'Rota (no semanal)' },
]
