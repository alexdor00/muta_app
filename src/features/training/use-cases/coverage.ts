import reglas from '../../../shared/content/coverage.json'
import { cobertura, type EjercicioCubre, type ReglaCobertura } from '../domain/coverage.ts'
import { ejercicioDeBiblioteca, porNombre } from './exerciseLibrary.ts'

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
