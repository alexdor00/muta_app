// Doble progresión con RIR (docs/conocimiento/02-reglas.md · «Doble progresión»; motor.js · suggestFor del prototipo).
// Sin el caso de descarga: solo se aplica si la rutina la pauta (decisión 2026-11-02) y aún no hay ninguna que lo haga.
import { formatDecimal, formatRange } from '../../../shared/lib/format.ts'
import { e1rm } from './e1rm.ts'
import { effortLabel } from './effort.ts'
import type { Range } from './muscles.ts'

/** Una serie de la última vez; `rir` es el RIR apuntado (null si no). */
export type SerieAnterior = { kg: number | null; reps: number; rir: number | null }

export type Sugerencia = {
  kg: number | null
  /** «6–10», «8» o «15+». */
  reps: string
  /** Sube, baja, mantén (o +1 rep), calculado con el 1RM de otra sesión, o primera vez. */
  tendencia: 'sube' | 'baja' | 'igual' | 'estimado' | 'nuevo'
  porque: string
}

const r2 = (x: number) => Math.round(x * 100) / 100

/** Redondea hacia abajo al salto de peso: 63,7 con saltos de 2,5 → 62,5. */
export function floorTo(x: number, step: number): number {
  return step > 0 ? r2(Math.floor(x / step + 1e-9) * step) : r2(x)
}

/**
 * Lo que toca hoy en la serie `i` de un ejercicio del plan, a partir de la misma serie de la última vez (o, si nunca se
 * hizo en este hueco, del mejor 1RM reciente en otra sesión). `rango` y `rir` son los del plan; `salto`, el del ejercicio.
 */
export function suggestFor(
  p: {
    ultima: SerieAnterior[] | null
    rango: Range
    rir: number
    salto: number
    /** Mejor 1RM estimado de las 3 últimas veces en otra sesión (o null). */
    mejorOtraSesion?: number | null
    pesoCorporal?: boolean
  },
  i = 0,
): Sugerencia {
  const [a, b] = p.rango
  const rango = formatRange([a, b])
  if (!p.ultima?.length) {
    if (p.mejorOtraSesion && p.mejorOtraSesion > 0 && !p.pesoCorporal) {
      const kg = floorTo(p.mejorOtraSesion / (1 + (a + p.rir) / 30), p.salto)
      return {
        kg,
        reps: rango,
        tendencia: 'estimado',
        porque: 'Calculado con tu 1RM estimado de este ejercicio en otra sesión.',
      }
    }
    return {
      kg: null,
      reps: rango,
      tendencia: 'nuevo',
      porque: `Primera vez: elige un peso con el que hagas ${rango} reps ${effortLabel(p.rir)}.`,
    }
  }
  const s = p.ultima[Math.min(i, p.ultima.length - 1)]
  if (s.kg == null || p.pesoCorporal) {
    if (s.reps >= b) {
      return {
        kg: null,
        reps: `${b}+`,
        tendencia: 'sube',
        porque: `Llegaste a ${s.reps}: añade lastre o pasa a una variante más difícil.`,
      }
    }
    const busca = Math.min(b, s.reps + 1)
    return {
      kg: null,
      reps: String(busca),
      tendencia: 'igual',
      porque: `Busca ${busca} reps (la última vez ${s.reps}).`,
    }
  }
  const rr = s.rir
  let sube = s.reps >= b && (rr == null || rr <= p.rir + 1)
  if (!sube && rr != null && rr >= p.rir + 3 && s.reps >= a) sube = true
  if (sube) {
    let kg = r2(s.kg + p.salto)
    // Si te pasaste 2 o más del máximo, sube hasta lo que da tu 1RM, como mucho un 10 %
    if (s.reps >= b + 2) {
      const porRM = floorTo(e1rm(s.kg, s.reps, rr ?? p.rir) / (1 + (a + p.rir) / 30), p.salto)
      kg = Math.max(kg, Math.min(porRM, floorTo(s.kg * 1.1, p.salto)))
    }
    const subes = formatDecimal(r2(kg - s.kg))
    return {
      kg,
      reps: rango,
      tendencia: 'sube',
      porque:
        s.reps >= b
          ? `Llegaste a ${s.reps} reps: subes ${subes} kg y vuelves a la parte baja del rango.`
          : `Te sobraron ${rr} reps en reserva (tocaba ${effortLabel(p.rir)}): subes ${subes} kg.`,
    }
  }
  if (s.reps < a) {
    let kg = floorTo(s.kg * 0.95, p.salto)
    if (kg >= s.kg) kg = r2(s.kg - p.salto)
    return {
      kg: Math.max(0, kg),
      reps: rango,
      tendencia: 'baja',
      porque: `Te quedaste en ${s.reps}, por debajo de ${a}: bajas un 5 % para volver al rango.`,
    }
  }
  const busca = Math.min(b, s.reps + 1)
  return {
    kg: s.kg,
    reps: String(busca),
    tendencia: 'igual',
    porque: `Mismo peso y busca ${busca} reps (la última vez ${s.reps}).`,
  }
}
