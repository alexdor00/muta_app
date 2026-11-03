// DATOS DE PRUEBA (ver datos.ts): el orden de la sesión en curso, que se cambia solo hoy («Hacer ahora» y los consejos
// que se arreglan con un toque), y lo de «Consejos de hoy» (C10). El plan no cambia.
import { signal } from '@preact/signals'
import type { SesionMuestra } from './datos.ts'
import { calentamientos, ejerciciosDe, nombreHoy, terminado, type SesionEnCurso } from './sesionEnCurso.ts'

/** «Mostrar al empezar»: la hoja de consejos se abre sola al empezar una sesión. Desactivado de serie. */
export const consejosAlEmpezar = signal(false)

export function alternarConsejosAlEmpezar(): void {
  consejosAlEmpezar.value = !consejosAlEmpezar.value
}

/** El primer ejercicio sin terminar, en el orden de hoy (o el primero). */
export const primeroSinTerminar = (en: SesionEnCurso | null): number =>
  en?.orden.find((i) => !terminado(en.ejercicios[i])) ?? en?.orden[0] ?? 0

/** El siguiente sin terminar después de `ej` en el orden de hoy; si no hay, el primero que falte; −1 si está todo. */
export function siguienteSinTerminar(en: SesionEnCurso, ej: number): number {
  const desde = en.orden.indexOf(ej)
  const falta = (i: number) => !terminado(en.ejercicios[i])
  return en.orden.slice(desde + 1).find(falta) ?? en.orden.find(falta) ?? -1
}

/** «Hacer ahora»: el ejercicio pasa al sitio del primero que falta (si ya va ahí, o ya está hecho, no cambia). */
export function hacerAhora(en: SesionEnCurso, ej: number): SesionEnCurso {
  if (terminado(en.ejercicios[ej])) return en
  const resto = en.orden.filter((i) => i !== ej)
  const hueco = resto.findIndex((i) => !terminado(en.ejercicios[i]))
  const orden = [...resto]
  orden.splice(hueco < 0 ? resto.length : hueco, 0, ej)
  return { ...en, orden }
}

/** Cambia de sitio dos ejercicios (por su posición en el orden de hoy). */
export function invertir(en: SesionEnCurso, a: number, b: number): SesionEnCurso {
  const orden = [...en.orden]
  ;[orden[a], orden[b]] = [orden[b], orden[a]]
  return { ...en, orden }
}

/** El calentamiento de cada ejercicio con el orden de hoy (solo calienta el primero de cada músculo), por su número. */
export function calentamientosHoy(sesion: SesionMuestra, en: SesionEnCurso) {
  const ejercicios = ejerciciosDe(sesion, en)
  const enOrden = calentamientos(en.orden.map((i) => ejercicios[i]))
  const plan: (typeof enOrden)[number][] = []
  en.orden.forEach((i, pos) => (plan[i] = enOrden[pos]))
  return plan
}

/** Los ejercicios de hoy en su orden, para «Para esta sesión»: el nombre de hoy y sus series. */
export const paraConsejos = (sesion: SesionMuestra, en: SesionEnCurso) => {
  const ejercicios = ejerciciosDe(sesion, en)
  return en.orden.map((i) => ({
    nombre: nombreHoy(ejercicios[i], en.ejercicios[i]),
    series: en.ejercicios[i].series.length,
  }))
}

/** Marca o desmarca uno de «Antes de la primera serie». */
export function marcarConsejo(en: SesionEnCurso, k: number): SesionEnCurso {
  const marcados = [...en.marcados]
  marcados[k] = !marcados[k]
  return { ...en, marcados }
}
