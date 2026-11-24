// Tu logro y tu premio (usuario, 2026-11-24; `Desktop/MUTA-Logro-Instagram-propuesta.png` y
// `Desktop/MUTA-Premio-objetivo-propuesta.png`): el logro, al acabar una etapa y cada 6 meses de la que llevas; el premio, al
// cumplir tu objetivo (definición: tu grasa objetivo; volumen: tu peso objetivo). Aquí, cuándo toca cada uno y las cifras
// que se calculan (el ejercicio estrella, lo que cambió tu cuerpo). Las imágenes, en use-cases/imagenLogro.ts.
import { PERIMETROS, type Medida, type PerimetroId } from './measures.ts'

export type FaseObjetivo = 'definicion' | 'volumen'

export type Pendiente =
  | { tipo: 'etapa'; etapaId: string }
  | { tipo: 'meses'; etapaId: string; meses: number }
  | { tipo: 'premio'; etapaId: string; fase: FaseObjetivo }

/** Cada cuántos meses de una etapa sale el logro (usuario, 2026-11-24). */
export const MESES_LOGRO = 6

/** Cómo se apunta que ya lo viste («Ahora no», compartir o guardar). */
export function claveDe(p: Pendiente): string {
  if (p.tipo === 'etapa') return `etapa:${p.etapaId}`
  if (p.tipo === 'meses') return `meses:${p.etapaId}:${p.meses}`
  return `premio:${p.etapaId}:${p.fase}`
}

/** La fecha de `meses` meses después (AAAA-MM-DD; si el día no existe, el último del mes). */
export function mesesDespues(fecha: string, meses: number): string {
  const [a, m, d] = fecha.split('-').map(Number)
  const total = a * 12 + (m - 1) + meses
  const [ano, mes] = [Math.floor(total / 12), (total % 12) + 1]
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`
}

/** Los meses enteros, en múltiplos de 6, que lleva una etapa a `hoy` (0 si aún no llega a 6). */
export function mesesCumplidos(inicio: string, hoy: string): number {
  let n = 0
  while (mesesDespues(inicio, n + MESES_LOGRO) <= hoy && n < 1200) n += MESES_LOGRO
  return n
}

type Etapa = { id: string; inicio: string; fin: string | null }

/**
 * Lo que toca enseñar, por orden: el premio (si cumpliste tu objetivo), las etapas que acabaron y los 6 meses de la que
 * llevas. Solo lo que pasó desde `desde` (el día que llegó esta función: lo de antes no se celebra de golpe) y lo que aún
 * no viste.
 */
export function pendientes(datos: {
  etapas: readonly Etapa[]
  desde: string
  hoy: string
  vistos: ReadonlySet<string>
  premio: { etapaId: string; fase: FaseObjetivo } | null
}): Pendiente[] {
  const { etapas, desde, hoy, vistos } = datos
  const out: Pendiente[] = []
  if (datos.premio) out.push({ tipo: 'premio', ...datos.premio })
  for (const e of [...etapas].sort((a, b) => a.inicio.localeCompare(b.inicio))) {
    if (e.fin) {
      if (e.fin >= desde) out.push({ tipo: 'etapa', etapaId: e.id })
      continue
    }
    const meses = mesesCumplidos(e.inicio, hoy)
    if (meses && mesesDespues(e.inicio, meses) >= desde) out.push({ tipo: 'meses', etapaId: e.id, meses })
  }
  return out.filter((p) => !vistos.has(claveDe(p)))
}

/** Si cumpliste tu objetivo: en definición, tu grasa en tu grasa objetivo o por debajo; en volumen, tu peso en el objetivo. */
export function objetivoCumplido(
  fase: string | null,
  ahora: { grasa: number | null; peso: number | null },
  objetivo: { grasa: number | null; peso: number | null },
): FaseObjetivo | null {
  if (fase === 'definicion' && ahora.grasa !== null && objetivo.grasa && ahora.grasa <= objetivo.grasa)
    return 'definicion'
  if (fase === 'volumen' && ahora.peso !== null && objetivo.peso && ahora.peso >= objetivo.peso)
    return 'volumen'
  return null
}

type SerieConKg = { kg: number | null; reps: number }
type PuntoEjercicio = { fecha: string; e1rm: number; serie: SerieConKg }

/**
 * Tu ejercicio estrella de un tramo: el que más subió su 1RM estimado de la primera vez a la última (hecho 3 veces o
 * más), con su mejor serie de la primera vez y de la última. null si ninguno sube.
 */
export function estrellaDe(
  ejercicios: readonly { nombre: string; puntos: readonly PuntoEjercicio[] }[],
  desde: string,
  hasta: string,
): { nombre: string; de: SerieConKg; a: SerieConKg; cambio: number } | null {
  let mejor: { nombre: string; de: SerieConKg; a: SerieConKg; cambio: number } | null = null
  for (const e of ejercicios) {
    const dentro = e.puntos.filter((p) => p.fecha >= desde && p.fecha <= hasta)
    const [primero, ultimo] = [dentro[0], dentro.at(-1)]
    if (dentro.length < 3 || !primero || !ultimo || !primero.e1rm) continue
    const cambio = ultimo.e1rm / primero.e1rm - 1
    if (cambio > 0 && (!mejor || cambio > mejor.cambio))
      mejor = { nombre: e.nombre, de: primero.serie, a: ultimo.serie, cambio }
  }
  return mejor
}

/**
 * El antes y el ahora de un tramo: al empezar, el último de antes (tu cuerpo al empezar, como en la etapa) o, si no hay, el
 * primero dentro; ahora, el último dentro. null sin dos distintos.
 */
export function antesYAhora<T extends { date: string }>(
  puntos: readonly T[],
  desde: string,
  hasta: string,
): [T, T] | null {
  const orden = [...puntos].sort((x, y) => x.date.localeCompare(y.date))
  const dentro = orden.filter((p) => p.date >= desde && p.date <= hasta)
  const antes = orden.filter((p) => p.date <= desde).at(-1) ?? dentro[0]
  const ahora = dentro.at(-1)
  return antes && ahora && antes !== ahora ? [antes, ahora] : null
}

/** Cuánto cambió algo en un tramo (de tu valor al empezar al último; con un decimal). null sin dos valores. */
export function cambioEnTramo(
  puntos: readonly { date: string; v: number }[],
  desde: string,
  hasta: string,
): { de: number; a: number; cambio: number } | null {
  const par = antesYAhora(puntos, desde, hasta)
  if (!par) return null
  const [a, b] = par
  return { de: a.v, a: b.v, cambio: Math.round((b.v - a.v) * 10) / 10 }
}

/** Los perímetros que más crecieron en un tramo (para el premio de volumen): sin la cintura, la cadera ni el cuello. */
export function perimetrosQueCrecen(
  medidas: readonly Medida[],
  desde: string,
  hasta: string,
  cuantos = 2,
): { id: PerimetroId; nombre: string; cm: number }[] {
  const crecen = PERIMETROS.filter((p) => !['cintura', 'cadera', 'cuello'].includes(p.id)).flatMap((p) => {
    const puntos = medidas.flatMap((m) => (m[p.id] ? [{ date: m.date, v: m[p.id] as number }] : []))
    const c = cambioEnTramo(puntos, desde, hasta)
    return c && c.cambio > 0 ? [{ id: p.id, nombre: p.nombre, cm: c.cambio }] : []
  })
  return crecen.sort((a, b) => b.cm - a.cm).slice(0, cuantos)
}
