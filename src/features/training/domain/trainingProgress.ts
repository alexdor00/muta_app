// Semanas de tus entrenos (Progreso): el lunes de la semana de un día, para contar por semanas (mesociclos y tu fuerza).
import { addDays } from '../../../shared/lib/format.ts'

/** El lunes de la semana de un día. */
export function lunesDe(iso: string): string {
  const dia = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7
  return addDays(iso, -dia)
}
