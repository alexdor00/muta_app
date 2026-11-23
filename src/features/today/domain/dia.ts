// Tu día en Hoy: juntar las cosas que da cada área, con lo que marcaste a mano, y decir lo que queda en una frase.
import type { TareaDeHoy } from '../../../shared/lib/tareaDeHoy.ts'

/** Lo que queda y lo hecho, cada uno en el orden del día. */
export function repartir(
  tareas: readonly TareaDeHoy[],
  marcadas: readonly string[],
): { quedan: TareaDeHoy[]; hechas: TareaDeHoy[] } {
  const marcar = (t: TareaDeHoy): TareaDeHoy =>
    t.aMano && marcadas.includes(t.id) ? { ...t, hecha: true } : t
  const todas = tareas
    .map((t) => {
      const conMarca = marcar(t)
      if (!t.partes?.length) return conMarca
      const partes = t.partes.map(marcar).sort((a, b) => a.orden - b.orden)
      return { ...conMarca, partes, hecha: conMarca.hecha && partes.every((x) => x.hecha) }
    })
    .sort((a, b) => a.orden - b.orden)
  return { quedan: todas.filter((t) => !t.hecha), hechas: todas.filter((t) => t.hecha) }
}

/** Cuántas cosas hay y cuántas hechas, contando las partes de cada una (el anillo de tu día). */
export function cuenta(tareas: readonly TareaDeHoy[]): { total: number; hechas: number } {
  const todas = tareas.flatMap((t) => [t, ...(t.partes ?? [])])
  return { total: todas.length, hechas: todas.filter((t) => t.hecha).length }
}

/** «Entrenar, comer y la compra.» (con mayúscula y punto); vacío si no queda nada. */
export function fraseQueda(quedan: readonly TareaDeHoy[]): string {
  const nombres = quedan.map((t) => t.corta)
  if (!nombres.length) return ''
  const lista = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
  return `${lista.charAt(0).toUpperCase()}${lista.slice(1)}.`
}
