// Reglas de una serie en la sesión en curso (las del prototipo anterior: entreno.js · setDone, motivacion.js · vsLast).
import { e1rm } from './e1rm.ts'

export type SerieHecha = { kg: number | null; reps: number }

/**
 * Una serie frente a la misma serie de la vez anterior, por su 1RM estimado: 1 mejor, 0 igual (±0,5 %), −1 peor;
 * null si no hay con qué comparar.
 */
export function compararConAntes(serie: SerieHecha, antes: SerieHecha | null): -1 | 0 | 1 | null {
  if (!antes || !(serie.reps > 0)) return null
  const hoy = e1rm(serie.kg, serie.reps, 0)
  const entonces = e1rm(antes.kg, antes.reps, 0)
  if (hoy > entonces * 1.005) return 1
  if (hoy < entonces * 0.995) return -1
  return 0
}

/**
 * Descanso tras una serie: el del ejercicio, y un minuto más si las repeticiones caen por debajo del 80 % de la
 * primera serie hecha (de 5 o más) con el mismo peso o más. Devuelve también de cuánto a cuánto bajó, para avisar.
 */
export function descansoTras(
  segundos: number,
  anteriores: SerieHecha[],
  serie: SerieHecha,
): { segundos: number; bajada: { de: number; a: number } | null } {
  const ref = anteriores.find((s) => s.reps >= 5)
  const mismoPeso = serie.kg === null || ref?.kg == null || serie.kg >= ref.kg * 0.97
  if (ref && serie.reps < ref.reps * 0.8 && mismoPeso) {
    return { segundos: segundos + 60, bajada: { de: ref.reps, a: serie.reps } }
  }
  return { segundos, bajada: null }
}

/** Cifras que caben en cada casilla al teclear. */
const LARGO = { kg: 6, reps: 3, quedan: 1 } as const

/**
 * Una tecla del teclado de la sesión sobre una casilla: cifras (la primera tras entrar sustituye lo que hay), coma (solo
 * kilos), borrar, y menos / más, que suman o restan el salto a lo escrito o, si está vacío, a lo gris. Devuelve el
 * texto nuevo y si la próxima cifra vuelve a sustituir; null si la tecla no hace nada ahí.
 */
export function teclear(
  casilla: { campo: keyof typeof LARGO; valor: string; gris: string; fresca: boolean; salto: number },
  tecla: string,
): { valor: string; fresca: boolean } | null {
  const { campo, valor, fresca } = casilla
  if (tecla === 'borrar') return { valor: valor.slice(0, -1), fresca: false }
  if (tecla === 'coma') {
    if (campo !== 'kg') return null
    const base = fresca ? '' : valor
    return { valor: base.includes(',') ? base : `${base || '0'},`, fresca: false }
  }
  if (tecla === 'menos' || tecla === 'mas') {
    const actual = parseFloat((valor || casilla.gris).replace(',', '.')) || 0
    const paso = campo === 'kg' ? casilla.salto : 1
    const nuevo = Math.max(0, Math.round((actual + (tecla === 'mas' ? paso : -paso)) * 100) / 100)
    return { valor: String(nuevo).replace('.', ','), fresca: true }
  }
  if (!/^\d$/.test(tecla)) return null
  const base = fresca ? '' : valor
  if (base.length >= LARGO[campo]) return null
  return { valor: base + tecla, fresca: false }
}

/** Números de una serie: más de 600 kg o 100 reps no se aceptan; más de 300 kg o 50 reps se confirman. */
export function revisarNumeros(kg: number | null, reps: number): 'ok' | 'alto' | 'imposible' {
  const k = kg ?? 0
  if (k < 0 || k > 600 || reps > 100) return 'imposible'
  if (k > 300 || reps > 50) return 'alto'
  return 'ok'
}
