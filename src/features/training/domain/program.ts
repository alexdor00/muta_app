import type { Slot } from './slots.ts'

// La forma de un programa (el JSON de cada rutina). Es el único sitio donde se define: el resto del dominio
// importa estos tipos en vez de declarar los suyos.

export type ExerciseKind = 'heavy' | 'compound' | 'isolation'

export type Exercise = {
  name: string
  /** El nombre en el documento original (inglés). */
  originalName?: string
  muscle?: string
  kind?: ExerciseKind
  /** Filas del mismo grupo = niveles de progresión del mismo ejercicio (solo se hace uno). */
  group?: string | null
  /** Opcional en MUTA (entra o no según tus prioridades). */
  optional?: boolean
  warmupSets?: string | number | null
  sets?: number | string | null
  reps?: string | null
  rpe?: string | null
  percent1RM?: string | null
  rest?: string | null
  technique?: string | null
  /** Sustitutos que da el propio programa (el generador elige el primero disponible). */
  substitutions?: string[]
  notes?: string | null
  /** Indicación del documento para ese ejercicio (solo texto). */
  tip?: string
  /** Lo que ponía la rutina antes de adaptarla (el coach guarda aquí el valor original). */
  original?: { sets?: number | string | null; rpe?: string | null }
  /** Ejercicio añadido por la adaptación (no estaba en la rutina). */
  added?: boolean
  /** Ejercicio quitado por la adaptación (0 series; se enseña tachado). */
  removed?: boolean
  /** Si se puede cambiar desde la rutina (opcional, punto débil…). */
  slot?: Slot
}

export type Session = { name: string; exercises: Exercise[] }
export type RestDay = { rest: true; note?: string }
export type Day = Session | RestDay

export type Week = { week: number; days: Day[] }
export type Block = { title?: string | null; weeks: Week[] }

/** Un programa: sus bloques con semanas y días. */
export type ProgramData = { blocks: Block[] }

export const isSession = (day: Day): day is Session => 'exercises' in day
