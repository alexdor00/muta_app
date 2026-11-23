// Una etapa (tu mesociclo: una rutina y una alimentación con un objetivo) y lo que te dio: tu cuerpo al empezar y ahora
// (peso, cintura, grasa y medidas), tu comida de media, tus fotos de antes y de ahora, y las cifras de cualquier tramo.
import { PERIMETROS, serieDe, type Medida, type Punto } from './measures.ts'
import { POSES, type Foto } from './photos.ts'

/** Un tramo: de un día a otro (`hasta` null: hasta hoy). */
export type Tramo = { desde: string | null; hasta: string | null }

const dentro = (date: string, t: Tramo) => (!t.desde || date >= t.desde) && (!t.hasta || date <= t.hasta)

export type Cifras = {
  inicio: number
  fin: number
  cambio: number
  /** Cambio por semana entre el primero y el último (null si están el mismo día). */
  porSemana: number | null
  desde: string
  hasta: string
}

/** Las cifras de una serie en un tramo: el primero, el último, cuánto cambió y a qué ritmo. null sin ningún punto. */
export function cifrasDe<T extends { date: string }>(
  puntos: readonly T[],
  valor: (p: T) => number,
  tramo: Tramo,
): Cifras | null {
  const en = puntos.filter((p) => dentro(p.date, tramo))
  const [a, b] = [en[0], en.at(-1)]
  if (!a || !b) return null
  const dias = (Date.parse(b.date) - Date.parse(a.date)) / 86_400_000
  return {
    inicio: valor(a),
    fin: valor(b),
    cambio: Math.round((valor(b) - valor(a)) * 100) / 100,
    porSemana: dias > 0 ? Math.round(((valor(b) - valor(a)) / dias) * 7 * 100) / 100 : null,
    desde: a.date,
    hasta: b.date,
  }
}

/** Lo que tenías al empezar (el último dato de antes, si lo hay) y lo de la etapa. Sin datos en la etapa, nada. */
function alEmpezar<T extends { date: string }>(puntos: readonly T[], tramo: Tramo): T[] {
  const en = puntos.filter((p) => dentro(p.date, tramo))
  const desde = tramo.desde
  const antes = desde ? puntos.filter((p) => p.date < desde).at(-1) : undefined
  return antes && en.length ? [antes, ...en] : en
}

const TODO: Tramo = { desde: null, hasta: null }

export type FilaCuerpo = {
  id: string
  nombre: string
  unidad: 'kg' | 'cm' | '%'
  inicio: number
  fin: number
  /** null si solo hay un dato en la etapa. */
  cambio: number | null
}

/**
 * Tu cuerpo en una etapa: lo que tenías al empezar (el último dato de antes o el primero de la etapa) y el último de tu peso de tendencia, tu cintura, tu grasa estimada y tus medidas
 * (la cintura, también la de la consulta). Solo lo que tiene algún dato en la etapa.
 */
export function cuerpoEnTramo(
  datos: {
    peso: readonly { date: string; tendencia: number }[]
    grasa: readonly { date: string; grasa: number }[]
    medidas: readonly Medida[]
    cinturas: readonly Punto[]
  },
  tramo: Tramo,
): FilaCuerpo[] {
  const fila = (id: string, nombre: string, unidad: FilaCuerpo['unidad'], c: Cifras | null): FilaCuerpo[] =>
    c
      ? [{ id, nombre, unidad, inicio: c.inicio, fin: c.fin, cambio: c.desde === c.hasta ? null : c.cambio }]
      : []
  const medida = (id: (typeof PERIMETROS)[number]['id']) =>
    cifrasDe(alEmpezar(serieDe(id, datos.medidas, datos.cinturas), tramo), (p) => p.cm, TODO)
  const nombre = (id: string) => PERIMETROS.find((p) => p.id === id)?.nombre ?? id
  return [
    ...fila(
      'peso',
      'Peso',
      'kg',
      cifrasDe(alEmpezar(datos.peso, tramo), (p) => p.tendencia, TODO),
    ),
    ...fila('cintura', 'Cintura', 'cm', medida('cintura')),
    ...fila(
      'grasa',
      'Grasa estimada',
      '%',
      cifrasDe(alEmpezar(datos.grasa, tramo), (p) => p.grasa, TODO),
    ),
    ...PERIMETROS.filter((p) => p.id !== 'cintura').flatMap((p) =>
      fila(p.id, nombre(p.id), 'cm', medida(p.id)),
    ),
  ]
}

export type ComidaEnTramo = {
  /** Media de kcal y de proteína de los días apuntados, y de tu objetivo esos días (null sin objetivo). */
  kcal: number
  proteina: number
  objetivo: number | null
  apuntados: number
}

/** Tu comida en una etapa: la media de lo que apuntaste. null si no apuntaste ningún día. */
export function comidaEnTramo(
  dias: readonly { date: string; kcal: number; protein: number; objetivo: number | null }[],
  tramo: Tramo,
): ComidaEnTramo | null {
  const en = dias.filter((d) => dentro(d.date, tramo))
  if (!en.length) return null
  const media = (xs: number[]) => Math.round(xs.reduce((t, x) => t + x, 0) / xs.length)
  const objetivos = en.flatMap((d) => (d.objetivo ? [d.objetivo] : []))
  return {
    kcal: media(en.map((d) => d.kcal)),
    proteina: media(en.map((d) => d.protein)),
    objetivo: objetivos.length ? media(objetivos) : null,
    apuntados: en.length,
  }
}

/**
 * Tus fotos de antes y de ahora en una etapa: la primera y la última de la misma postura (frente primero) en días
 * distintos. null si no hay dos días con la misma postura.
 */
export function fotosEnTramo<T extends Foto>(
  fotos: readonly T[],
  tramo: Tramo,
): { antes: T; ahora: T } | null {
  for (const pose of POSES) {
    const de = fotos
      .filter((f) => f.pose === pose.id && dentro(f.date, tramo))
      .sort((a, b) => a.date.localeCompare(b.date))
    const [antes, ahora] = [de[0], de.at(-1)]
    if (antes && ahora && antes.date !== ahora.date) return { antes, ahora }
  }
  return null
}

/** Cuántos días con fotos hay en una etapa. */
export const diasConFotosEn = (fotos: readonly Foto[], tramo: Tramo) =>
  new Set(fotos.filter((f) => dentro(f.date, tramo)).map((f) => f.date)).size

/**
 * Una serie de cambios (tu fuerza semana a semana: 0,05 es un 5 % más que al empezar a entrenar) contada desde el principio
 * de un tramo: la primera semana del tramo pasa a ser 0.
 */
export function desdeElPrincipio(
  serie: readonly { date: string; cambio: number }[],
  tramo: Tramo,
): { date: string; cambio: number }[] {
  const en = serie.filter((p) => dentro(p.date, tramo))
  const base = 1 + (en[0]?.cambio ?? 0)
  return en.map((p) => ({ date: p.date, cambio: Math.round(((1 + p.cambio) / base - 1) * 1000) / 1000 }))
}

/** Tus fotos de un tramo (un mes): la última de cada postura. */
export function fotosDelTramo<T extends Foto>(
  fotos: readonly T[],
  tramo: Tramo,
): Partial<Record<T['pose'], T>> {
  const out: Partial<Record<T['pose'], T>> = {}
  for (const f of [...fotos].sort((a, b) => a.date.localeCompare(b.date)))
    if (dentro(f.date, tramo)) out[f.pose as T['pose']] = f
  return out
}

/** Un mes (AAAA-MM) como tramo: de su día 1 a su día 31 (los días que no existen no cuentan). */
export const mesComoTramo = (mes: string): Tramo => ({ desde: `${mes}-01`, hasta: `${mes}-31` })

/** El mes `n` meses después (o antes, con `n` negativo): «2026-11», −1 → «2026-10». */
export function otroMes(mes: string, n: number): string {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Los meses de uno a otro (incluidos), del primero al último. */
export function mesesEntre(desde: string, hasta: string): string[] {
  const out: string[] = []
  for (let m = desde; m <= hasta && out.length < 600; m = otroMes(m, 1)) out.push(m)
  return out
}

export type EjercicioEnMes<T> = {
  /** El día de su mejor 1RM del mes y el de antes con el que se compara (null si no hay). */
  mejor: T
  anterior: T | null
  /** Su mejor 1RM estimado del mes y el de antes (el del mes anterior o, si no lo hiciste, el último de antes). */
  a: number
  de: number | null
  cambio: number | null
  /** Más de un 1 % sobre todo lo de antes del mes. */
  record: boolean
}

/** Un ejercicio en un mes frente a antes; null si no lo hiciste ese mes. */
export function ejercicioEnMes<T extends { fecha: string; e1rm: number }>(
  puntos: readonly T[],
  mes: string,
): EjercicioEnMes<T> | null {
  const elMejor = (xs: readonly T[]) => xs.reduce<T | null>((m, p) => (!m || p.e1rm > m.e1rm ? p : m), null)
  const mejor = elMejor(puntos.filter((p) => p.fecha.startsWith(mes)))
  if (!mejor) return null
  const a = mejor.e1rm
  const antes = puntos.filter((p) => p.fecha < mes)
  const anterior = elMejor(antes.filter((p) => p.fecha.startsWith(otroMes(mes, -1)))) ?? antes.at(-1) ?? null
  const de = anterior?.e1rm ?? null
  const mejorDeAntes = antes.length ? Math.max(...antes.map((p) => p.e1rm)) : null
  return {
    mejor,
    anterior,
    a,
    de,
    cambio: de ? Math.round((a / de - 1) * 1000) / 1000 : null,
    record: mejorDeAntes !== null && a > mejorDeAntes * 1.01,
  }
}

/**
 * Tu fuerza en un mes frente al anterior: la media de tus básicos (semana a semana) de su última semana del mes frente a la
 * última de antes del mes. null si no hay semanas en el mes o ninguna antes.
 */
export function fuerzaDelMes(
  semanal: readonly { date: string; cambio: number }[],
  mes: string,
): number | null {
  const fin = semanal.filter((s) => s.date.startsWith(mes)).at(-1)
  const antes = semanal.filter((s) => s.date < mes).at(-1)
  if (!fin || !antes) return null
  return Math.round(((1 + fin.cambio) / (1 + antes.cambio) - 1) * 1000) / 1000
}

/**
 * Un ejercicio un día frente a la vez anterior: su 1RM estimado de ese día frente al del último día de antes. null si ese día
 * no lo hiciste o no lo habías hecho antes.
 */
export function frenteALaAnterior(
  puntos: readonly { fecha: string; e1rm: number }[],
  fecha: string,
): number | null {
  const ese = puntos.find((p) => p.fecha === fecha)
  const antes = puntos.filter((p) => p.fecha < fecha).at(-1)
  if (!ese || !antes) return null
  return Math.round((ese.e1rm / antes.e1rm - 1) * 1000) / 1000
}
