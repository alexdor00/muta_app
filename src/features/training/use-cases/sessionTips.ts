import pre from '../../../shared/content/tips/pre.json'
import session from '../../../shared/content/tips/session.json'
import type { MuscleId } from '../domain/muscles.ts'
import { sessionTips, type SessionTip, type TipId, type TipText } from '../domain/sessionTips.ts'
import { elecciones } from '../state/musculos.ts'
import { porNombre } from './exerciseLibrary.ts'

/** «Antes de la primera serie»: los 9 del prototipo anterior (scripts/tips-from-prototype.cjs). */
export const CONSEJOS_ANTES = pre as { text: string; why: string; source: string }[]

const TEXTOS = session as Record<TipId, TipText>

/** Tus músculos de la ficha del músculo: los que pusiste en Prioridad y en Mantener. */
function tusMusculos(): { prioridades: MuscleId[]; mantener: MuscleId[] } {
  const lista = Object.entries(elecciones.value) as [MuscleId, { modo: string } | undefined][]
  const con = (modo: string) => lista.filter(([, e]) => e?.modo === modo).map(([m]) => m)
  return { prioridades: con('priority'), mantener: con('maintain') }
}

/**
 * «Para esta sesión»: los consejos para los ejercicios de hoy, en su orden (por nombre o su alias; los que no están en la biblioteca
 * no cuentan). Los números de las acciones son posiciones en la lista que se pasa. Sin `musculos`, los que elegiste en la
 * ficha de cada músculo (el consejo de prioridades sale con ellos).
 */
export function consejosDeSesion(
  ejercicios: { nombre: string; series: number }[],
  musculos: { prioridades?: MuscleId[]; mantener?: MuscleId[] } = tusMusculos(),
): SessionTip[] {
  const conocidos = ejercicios.flatMap((x, i) => {
    const e = porNombre(x.nombre)
    return e ? [{ e: { ...e, sets: x.series }, i }] : []
  })
  const original = (k: number) => conocidos[k].i
  return sessionTips(
    conocidos.map((c) => c.e),
    TEXTOS,
    musculos,
  ).map((t) => ({
    ...t,
    accion:
      t.accion?.tipo === 'invertir'
        ? { tipo: 'invertir', a: original(t.accion.a), b: original(t.accion.b) }
        : t.accion?.tipo === 'subir'
          ? { tipo: 'subir', indice: original(t.accion.indice) }
          : null,
  }))
}
