import { localDate, parseDecimal } from '../../../shared/lib/format.ts'
import type { Entreno } from '../domain/workoutHistory.ts'
import {
  ejerciciosDe,
  extrasHechos,
  nombreHoy,
  segundosSesion,
  type SesionEnCurso,
} from '../state/sesionEnCurso.ts'

/** Lo hecho de una sesión, como se guarda: solo las series marcadas, en el orden de hoy. */
export function entrenoDe(en: SesionEnCurso, programId: string, ahora: number): Entreno {
  const ejercicios = ejerciciosDe(en)
  return {
    id: crypto.randomUUID(),
    fecha: localDate(new Date(en.inicio)),
    inicio: en.inicio,
    segundos: Math.round(segundosSesion({ ...en, terminada: ahora }, ahora)),
    sigla: en.sigla,
    nombre: en.nombre,
    programId,
    ejercicios: en.orden.flatMap((i, puesto) => {
      const e = ejercicios[i]
      const x = en.ejercicios[i]
      const series = x.series
        .filter((s) => s.hecha)
        .map((s) => {
          const extra = extrasHechos(e, s)
          return {
            kg: parseDecimal(s.kg),
            reps: parseDecimal(s.reps) ?? 0,
            ...(extra.length ? { extra } : {}),
          }
        })
      return series.length
        ? [{ nombre: nombreHoy(e, x), musculo: e.musculo, series, puesto: puesto + 1 }]
        : []
    }),
  }
}
