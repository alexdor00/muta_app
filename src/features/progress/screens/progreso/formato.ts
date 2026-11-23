// Cómo se escriben las cifras de Progreso: un cambio con su signo y su unidad, el de la fuerza en %, las fechas de una etapa
// y una serie.
import { formatChange, formatDecimal, formatShortDate } from '../../../../shared/lib/format.ts'
import type { SerieHecha, TarjetaMeso } from '../../../training/index.ts'

/** Signo y un decimal como mucho: 0.5 → «+0,5», −1 → «−1». */
export const conSigno = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatDecimal(Math.abs(n))}`

/** Un cambio con un decimal y su unidad, o «=» si no cambió: «−1,3 kg». */
export const cambioTexto = (n: number, unidad: string) => {
  const r = Math.round(n * 10) / 10
  return r === 0 ? '=' : `${conSigno(r)} ${unidad}`
}

/** Un cambio en %: 0,02 → «+2 %», 0 → «=»; «—» si no se sabe. */
export const fuerzaTexto = (cambio: number | null) =>
  cambio === null ? '—' : Math.round(cambio * 100) === 0 ? '=' : formatChange(cambio, 0)

/** Las fechas de una etapa: «13 oct – hoy» o «2 ago – 15 sep». */
export const fechasDe = (m: TarjetaMeso) =>
  `${formatShortDate(m.inicio)} – ${m.fin ? formatShortDate(m.fin) : 'hoy'}`

/** «62,5 kg × 8» o «12 reps». */
export const textoSerie = (s: SerieHecha) =>
  s.kg ? `${formatDecimal(s.kg)} kg × ${s.reps}` : `${s.reps} reps`

/** Un valor con un decimal como mucho y su unidad: «81,4 kg». */
export const valorTexto = (n: number, unidad: string) => `${formatDecimal(Math.round(n * 10) / 10)} ${unidad}`
