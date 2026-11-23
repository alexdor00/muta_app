/**
 * Tus ollas (usuario, 2026-11-21): lo que pesa cada una vacía, que no cambia, se pesa una vez y se guarda; al repartir
 * solo pesas la olla llena. Se recuerda la última olla de cada receta.
 */
export type Olla = { id: string; nombre: string; gramos: number }

/** Cómo se reparte una receta: todo junto (se pesa la olla) o por partes (se pesa lo que se cuece: arroz, pasta…). */
export type ModoReparto = 'junto' | 'partes'

export type Ollas = {
  lista: Olla[]
  dePlato: Record<string, string>
  /**
   * Lo que rinde cocinado (usuario, 2026-11-21: «que aprenda»): lo que pesó entre lo que dice la receta. `olla:<plato>`
   * para todo junto; `ing:<alimento>` para lo que se cuece. La próxima vez se estima sin pesar.
   */
  rinde: Record<string, number>
  /** Cómo repartes cada receta, si lo cambiaste (si no, lo que propone la app). */
  modo: Record<string, ModoReparto>
}

export const SIN_OLLAS: Ollas = { lista: [], dePlato: {}, rinde: {}, modo: {} }

/** Lo guardado, sin lo que no tiene forma de olla. */
export function leerOllas(x: unknown): Ollas {
  if (!x || typeof x !== 'object') return SIN_OLLAS
  const o = x as Partial<Ollas>
  const lista = Array.isArray(o.lista)
    ? o.lista.filter(
        (y): y is Olla =>
          !!y && typeof y.id === 'string' && typeof y.nombre === 'string' && typeof y.gramos === 'number',
      )
    : []
  const dePlato =
    o.dePlato && typeof o.dePlato === 'object'
      ? Object.fromEntries(Object.entries(o.dePlato).filter(([, v]) => typeof v === 'string'))
      : {}
  const rinde =
    o.rinde && typeof o.rinde === 'object'
      ? Object.fromEntries(Object.entries(o.rinde).filter(([, v]) => typeof v === 'number' && v > 0))
      : {}
  const modo =
    o.modo && typeof o.modo === 'object'
      ? Object.fromEntries(Object.entries(o.modo).filter(([, v]) => v === 'junto' || v === 'partes'))
      : {}
  return { lista, dePlato, rinde, modo }
}

/** Lo cocinado: la olla llena menos lo que pesa vacía (o, sin olla, lo que pesaste). Null si no cuadra. */
export function pesoDeLaComida(pesado: number, olla: Olla | null): number | null {
  const neto = olla ? pesado - olla.gramos : pesado
  return neto > 0 ? neto : null
}

/** Lo que rinde: lo pesado entre lo que dice la receta (null si falta algo). */
export function rindeDe(pesado: number, receta: number): number | null {
  return pesado > 0 && receta > 0 ? Math.round((pesado / receta) * 1000) / 1000 : null
}
