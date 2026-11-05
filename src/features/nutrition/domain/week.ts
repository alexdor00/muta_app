// La semana de comida: los 7 últimos días frente a tu objetivo. Hoy se ve, pero no cuenta en la media (aún no ha terminado).
import { addDays } from '../../../shared/lib/format.ts'

export type DiaSemana = { date: string; kcal: number; protein: number; hoy: boolean; apuntado: boolean }

export type ResumenSemana = {
  dias: DiaSemana[]
  /** Media de kcal de los días con algo apuntado, sin hoy; null si no hay ninguno. */
  media: number | null
  /** La media frente al objetivo, en tanto por uno. */
  cumplido: number | null
  /** Días (sin hoy) con algo apuntado y los que llegaron a la proteína. */
  contados: number
  conProteina: number
}

/** Los `n` últimos días hasta hoy, del más antiguo al de hoy. */
export function ultimosDias(hoy: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(hoy, i - n + 1))
}

export function resumenSemana(
  totales: Readonly<Record<string, { kcal: number; protein: number }>>,
  hoy: string,
  objetivo: { kcal: number; protein: number },
): ResumenSemana {
  const dias = ultimosDias(hoy, 7).map((date) => {
    const t = totales[date]
    return {
      date,
      kcal: t?.kcal ?? 0,
      protein: t?.protein ?? 0,
      hoy: date === hoy,
      apuntado: !!t && t.kcal > 0,
    }
  })
  const pasados = dias.filter((d) => !d.hoy && d.apuntado)
  const media = pasados.length ? Math.round(pasados.reduce((s, d) => s + d.kcal, 0) / pasados.length) : null
  return {
    dias,
    media,
    cumplido: media === null ? null : Math.round((media / objetivo.kcal) * 100) / 100,
    contados: pasados.length,
    conProteina: pasados.filter((d) => d.protein >= objetivo.protein).length,
  }
}

/** La letra del día de la semana: «L», «M», «X»… */
export function letraDia(iso: string): string {
  return ['D', 'L', 'M', 'X', 'J', 'V', 'S'][new Date(`${iso}T00:00:00Z`).getUTCDay()]
}
