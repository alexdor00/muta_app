import reglas from '../../../shared/content/coverage.json'
import { cobertura, type EjercicioCubre, type ReglaCobertura } from '../domain/coverage.ts'
import { MUSCLES } from '../domain/muscles.ts'
import { ejercicioDeBiblioteca, porNombre } from './exerciseLibrary.ts'
import { consejosDeSesion } from './sessionTips.ts'

const REGLAS = reglas as ReglaCobertura[]

/**
 * La cobertura de tu plan según el método (hoja «Cobertura muscular»): los ejercicios de todas tus sesiones (los que están
 * en la biblioteca) frente a la tabla, con lo sugerido ya como ejercicios de la biblioteca.
 */
export function coberturaDelPlan(sesiones: readonly { ejercicios: readonly { nombre: string }[] }[]) {
  const ejercicios: EjercicioCubre[] = sesiones.flatMap((s) =>
    s.ejercicios.flatMap((e) => {
      const lib = porNombre(e.nombre)
      return lib ? [{ id: lib.id, pattern: lib.pattern, primary: lib.primary }] : []
    }),
  )
  const { porRevisar, bien } = cobertura(REGLAS, ejercicios)
  return {
    porRevisar: porRevisar.map((r) => ({
      ...r,
      faltan: r.faltan.map((p) => ({
        falta: p.falta,
        sugiere: p.sugiere.flatMap((id) => {
          const ex = ejercicioDeBiblioteca(id)
          return ex ? [ex] : []
        }),
      })),
    })),
    bien,
  }
}

/** Minúscula al principio: «Pide un inclinado…». */
const enFrase = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * Lo que dice el entrenador en Editar rutina para una sesión: primero los consejos de esa sesión (los mismos de Ver
 * sesión), después lo que le falta a tu plan según el método, con el ejercicio que lo cubre (`anadir`).
 */
export function consejosDelEntrenador(
  sesion: { ejercicios: readonly { nombre: string; series: number }[] },
  todas: readonly { ejercicios: readonly { nombre: string }[] }[],
) {
  return [
    ...consejosDeSesion([...sesion.ejercicios]).map((t) => ({ text: t.text, why: t.why, anadir: null })),
    ...coberturaDelPlan(todas).porRevisar.flatMap((r) =>
      r.faltan.map((p) => ({
        text: `${MUSCLES[r.musculo].label}: ${p.falta}.`,
        why: `El método pide ${enFrase(r.pide)}.`,
        anadir: p.sugiere[0] ?? null,
      })),
    ),
  ]
}
