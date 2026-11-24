// Terminaste tu rutina (usuario, 2026-11-23): se marca al hacer la última sesión de su última semana y se ve en el resumen
// y en Tu plan hasta que eliges «Repetirla», cambias de rutina o dices «Ahora no». Nada cambia hasta que eliges.
import { signal } from '@preact/signals'

export type FinDeRutina = {
  /** La rutina que terminaste y cuándo (la fecha del entreno con que acabó). */
  programId: string
  rutina: string
  fecha: string
  /** Las semanas que tiene. */
  semanas: number
  /** El entreno con que acabó: «Me faltó un ejercicio» lo deshace y quita la marca. */
  entrenoId: string
}

export const finDeRutina = signal<FinDeRutina | null>(null)
