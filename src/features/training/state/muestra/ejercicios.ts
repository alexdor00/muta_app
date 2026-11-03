// DATOS DE PRUEBA (ver datos.ts): lo que se calcula sobre un ejercicio de prueba: lo que toca hoy (el motor), pasarlo
// desde la biblioteca, dónde está en el plan y su historial. Se borra con el resto de state/muestra/.
import type { LibraryExercise } from '../../domain/exerciseLibrary.ts'
import type { VezEjercicio } from '../../domain/exerciseProgress.ts'
import type { MuscleId, Range } from '../../domain/muscles.ts'
import { floorTo, suggestFor, type Sugerencia } from '../../domain/progression.ts'
import { anteriores, MUESTRA, type EjercicioMuestra } from './datos.ts'

/** «6–10» → [6, 10]; si no se entiende, null. */
export function rangoDe(texto: string): Range | null {
  const [a, b] = texto.split('–').map(Number)
  return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null
}

/** Lo que toca hoy en la serie `i` según el motor (doble progresión desde la última vez). */
export function sugerenciaDe(e: EjercicioMuestra, i = 0): Sugerencia {
  const minimo = parseInt(e.reps, 10) || 1
  return suggestFor(
    {
      ultima: anteriores(e).map((s) => ({ ...s, rir: null })),
      rango: rangoDe(e.reps) ?? [minimo, minimo],
      rir: e.rir,
      salto: e.salto,
      pesoCorporal: e.pesoCorporal,
    },
    i,
  )
}

/** Los kilos de hoy de la serie `i` (null con peso corporal o si es la primera vez). */
export const kilosDeHoy = (e: EjercicioMuestra, i = 0) => sugerenciaDe(e, i).kg

/**
 * Un ejercicio de la biblioteca para añadirlo hoy a la sesión (entreno.js · add-ex-session del prototipo): 3 series con
 * las repeticiones, el esfuerzo, el descanso y el salto de la biblioteca, sin vez anterior ni sustitutos.
 */
export function desdeBiblioteca(ex: LibraryExercise): EjercicioMuestra {
  return {
    nombre: ex.name,
    series: 3,
    reps: `${ex.reps[0]}–${ex.reps[1]}`,
    rir: ex.rir,
    ultima: [],
    descanso: ex.restSec,
    musculo: ex.primary,
    secundarios: (Object.entries(ex.contributes) as [MuscleId, number][])
      .filter(([m, c]) => m !== ex.primary && c >= 0.5)
      .map(([m]) => m),
    compuesto: ex.kind === 'compound',
    pesoCorporal: ex.equipment === 'bodyweight',
    salto: ex.stepKg,
    sustitutos: [],
  }
}

/** Dónde está un ejercicio en el plan (la primera sesión que lo lleva), o null si no está. */
export function enTuPlan(nombre: string): { sigla: string; indice: number; e: EjercicioMuestra } | null {
  for (const s of MUESTRA.sesiones) {
    const indice = s.ejercicios.findIndex((e) => e.nombre === nombre)
    if (indice >= 0) return { sigla: s.sigla, indice, e: s.ejercicios[indice] }
  }
  return null
}

/**
 * Cada vez que se hizo un ejercicio (las fechas de los entrenos de las sesiones que lo llevan), la más antigua primero.
 * La última es `ultima` (en su puesto de la sesión); hacia atrás, los kilos bajan poco a poco (un 0,2 % por vez, al salto) y, con peso corporal,
 * una rep cada 8 veces.
 */
export function historialEjercicio(e: EjercicioMuestra): VezEjercicio[] {
  const siglas = new Set(MUESTRA.sesiones.filter((s) => s.ejercicios.includes(e)).map((s) => s.sigla))
  const fechas = MUESTRA.entrenos.filter((x) => siglas.has(x.sesion)).map((x) => x.fecha)
  const ultima = anteriores(e)
  const puesto = (enTuPlan(e.nombre)?.indice ?? 0) + 1
  return fechas.map((fecha, i) => {
    const atras = fechas.length - 1 - i
    if (atras === 0) return { fecha, series: ultima, puesto }
    return {
      fecha,
      // Una de cada 9 veces (la penúltima entre ellas) se hizo en otro puesto: primero, o tercero si ya iba primero
      puesto: atras % 9 === 1 ? (puesto === 1 ? 3 : 1) : puesto,
      series: ultima.map((s) => ({
        kg: s.kg ? Math.max(e.salto, floorTo(s.kg * (1 - 0.002 * atras), e.salto)) : s.kg,
        reps: Math.max(1, s.reps - (e.pesoCorporal ? Math.floor(atras / 8) : 0)),
      })),
    }
  })
}
