// Números y fechas en pantalla, a la española: coma decimal («7,1 t», «−7 %») y «Vie 23 oct».

const decimal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
// A mano y no con Intl: según el navegador, Intl escribe «sept» o «sep.»; el diseño lleva «sep»
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** Número con un decimal como mucho: 2.5 → «2,5». */
export function formatDecimal(value: number): string {
  return decimal.format(value)
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

/** Toneladas con un decimal como mucho: 7.1 → «7,1 t», 7 → «7 t». */
export function formatTons(tons: number): string {
  return `${formatDecimal(tons)} t`
}

/** Cambio en tanto por uno, con signo y sin decimales: −0.066 → «−7 %», 0.024 → «+2 %». */
export function formatChange(ratio: number): string {
  const pct = Math.round(ratio * 100)
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : ''
  return `${sign}${Math.abs(pct)} %`
}
