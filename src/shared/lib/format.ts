// Números y fechas en pantalla, a la española: coma decimal («7,1 t», «−7 %») y «Vie 23 oct».

const decimal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
// Los kilos llevan hasta dos decimales (discos de 1,25)
const decimales = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })
// «2.260»: en español Intl no separa los miles de 4 cifras, y las kcal se leen mejor con el punto
const entero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' })
// A mano y no con Intl: según el navegador, Intl escribe «sept» o «sep.»; el diseño lleva «sep»
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** Número con dos decimales como mucho: 2.5 → «2,5», 1.25 → «1,25». */
export function formatDecimal(value: number): string {
  return decimales.format(value)
}

/** Lee un número escrito a la española: «62,5» → 62.5; vacío o sin número → null. */
export function parseDecimal(text: string): number | null {
  const value = parseFloat(text.trim().replace(',', '.'))
  return Number.isFinite(value) ? value : null
}

/** Tiempo de reloj: 165 → «2:45», 4 → «0:04», 3909 → «1:05:09». */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const dos = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${dos(m)}:${dos(s % 60)}` : `${m}:${dos(s % 60)}`
}

/** Descanso entre series: «2:30»; 0 → «sin descanso» (la rutina pide pasar directamente al siguiente). */
export function formatRest(seconds: number): string {
  return seconds > 0 ? formatClock(seconds) : 'sin descanso'
}

/** Fecha corta (AAAA-MM-DD): «2026-09-18» → «18 sep». */
export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`
}

/** Fecha con el día de la semana: «2026-10-23» → «Vie 23 oct». */
export function formatDayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return `${DIAS[d.getUTCDay()]} ${formatShortDate(iso)}`
}

/** Texto para buscar: sin tildes y en minúsculas («Glúteo» → «gluteo»). */
export function plainText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Toneladas con un decimal como mucho: 7.1 → «7,1 t», 7 → «7 t». */
export function formatTons(tons: number): string {
  return `${decimal.format(tons)} t`
}

/** Cambio en tanto por uno, con signo y `cifras` decimales (ninguno de serie): −0.066 → «−7 %», 0.024 → «+2 %». */
export function formatChange(ratio: number, cifras = 0): string {
  const f = 10 ** cifras
  const pct = Math.round(ratio * 100 * f) / f
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : ''
  return `${sign}${formatDecimal(Math.abs(pct))} %`
}

/** La fecha de un momento en hora local, como AAAA-MM-DD (la de hoy, sin argumento). */
export function localDate(at = new Date()): string {
  return new Date(at.getTime() - at.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/** Una fecha AAAA-MM-DD movida `days` días: («2026-11-05», −1) → «2026-11-04». */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Días de una fecha AAAA-MM-DD a otra: («2026-11-01», «2026-11-05») → 4. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

/** Número entero con punto de miles: 2260 → «2.260». */
export function formatInt(value: number): string {
  return entero.format(Math.round(value))
}

/** Un rango de números: «6–10», o «15» si los dos son iguales. */
export function formatRange([a, b]: readonly [number, number]): string {
  return a === b ? String(a) : `${a}–${b}`
}
