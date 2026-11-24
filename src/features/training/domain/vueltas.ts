// Tus vueltas a una misma rutina (usuario, 2026-11-23): cada etapa con la misma rutina se compara con otra a la misma
// semana —la semana 4 de esta frente a la semana 4 de aquella—, sesión con sesión y ejercicio con ejercicio. Rutinas
// distintas no se comparan. Los ejercicios llegan con un solo nombre (`unificarNombres`), así que se emparejan por él.
import { daysBetween } from '../../../shared/lib/format.ts'
import { e1rm } from './e1rm.ts'
import { constanciaDe, mejorDe, semanasDe, toneladasDe, type Mesociclo, type Semana } from './mesocycles.ts'
import { fuerzaPorSemana } from './strengthHistory.ts'
import { lunesDe } from './trainingProgress.ts'
import type { Entreno } from './workoutHistory.ts'
import type { SerieHecha } from './workoutSet.ts'

/** Las etapas con las que se puede comparar una: las demás con su misma rutina, de la más reciente a la más antigua. */
export function comparables(m: Mesociclo, todos: readonly Mesociclo[]): Mesociclo[] {
  return todos
    .filter((x) => x.id !== m.id && x.programId === m.programId)
    .sort((a, b) => b.inicio.localeCompare(a.inicio))
}

/**
 * Con cuál se compara una etapa de serie: la última anterior con su misma rutina y su mismo objetivo (volumen con volumen);
 * si no hay, la última anterior con su misma rutina. Si es la primera (abres una vieja), la siguiente: también primero con
 * su mismo objetivo. null si no hay ninguna.
 */
export function parejaDe(m: Mesociclo, todos: readonly Mesociclo[]): Mesociclo | null {
  const otras = comparables(m, todos)
  const mismo = (x: Mesociclo) => x.objetivo !== null && x.objetivo === m.objetivo
  const antes = otras.filter((x) => x.inicio < m.inicio)
  const despues = otras.filter((x) => x.inicio >= m.inicio).reverse()
  return antes.find(mismo) ?? antes[0] ?? despues.find(mismo) ?? despues[0] ?? null
}

/** El nombre de la vuelta siguiente: «Definición» → «Definición · vuelta 2»; «… · vuelta 2» → «… · vuelta 3». */
export function nombreDeVuelta(nombre: string): string {
  const m = /^(.*) · vuelta (\d+)$/.exec(nombre)
  return m ? `${m[1]} · vuelta ${Number(m[2]) + 1}` : `${nombre} · vuelta 2`
}

/** Más de un 0,5 % mejor o peor (como «suben» y «bajan» del resumen de una etapa); si no, igual. */
const MARGEN = 0.005

export type SesionComparada = { sigla: string; nombre: string; a: number | null; b: number | null }
export type EjercicioComparado = {
  nombre: string
  a: SerieHecha | null
  b: SerieHecha | null
  /** 1 mejor ahora, 0 igual, −1 peor; null si falta en alguna de las dos. */
  cambio: -1 | 0 | 1 | null
}

export type Vueltas = {
  /** La semana que se compara (la misma en las dos) y las semanas enteras que cuentan para las medias. */
  semana: number
  cerradas: number
  /** Ejercicios de esa semana mejores ahora, y cuántos se pudieron comparar. */
  delante: number
  comparados: number
  /** Tu fuerza en tus básicos semana a semana (cambio desde la primera; 0 = como al empezar). [0] es la semana 1. */
  carrera: { a: (number | null)[]; b: (number | null)[] }
  /** Tu fuerza hasta la semana que se compara. */
  fuerza: { a: number | null; b: number | null }
  /** Toneladas por semana y constancia (%) en las semanas enteras; null si aún no hay ninguna. */
  toneladas: { a: number; b: number } | null
  constancia: { a: number | null; b: number | null } | null
  sesiones: SesionComparada[]
  ejercicios: EjercicioComparado[]
}

/** La fuerza de una etapa semana a semana, por número de semana (null la que aún no hiciste ningún básico). */
function carreraDe(m: Mesociclo, semanas: readonly Semana[], basicos: readonly string[]) {
  const suyos = semanas.flatMap((w) => w.entrenos)
  const porLunes = new Map(fuerzaPorSemana(suyos, basicos).map((x) => [x.lunes, x.cambio]))
  const inicio = lunesDe(m.inicio)
  const out: (number | null)[] = semanas.map(() => null)
  for (const [lunes, cambio] of porLunes) {
    const i = daysBetween(inicio, lunes) / 7
    if (i >= 0 && i < out.length) out[i] = cambio
  }
  return out
}

/** El último valor conocido hasta la semana `n` (1, 2…). */
const hasta = (linea: readonly (number | null)[], n: number) =>
  linea
    .slice(0, n)
    .filter((x): x is number => x !== null)
    .at(-1) ?? null

/** La mejor serie de cada ejercicio en una semana (por su 1RM estimado). */
function mejoresDe(semana: Semana | undefined): Map<string, SerieHecha> {
  const out = new Map<string, { valor: number; serie: SerieHecha }>()
  for (const x of semana?.entrenos ?? [])
    for (const e of x.ejercicios) {
      const { valor, serie } = mejorDe(e)
      if (serie && valor > (out.get(e.nombre)?.valor ?? 0)) out.set(e.nombre, { valor, serie })
    }
  return new Map([...out].map(([k, v]) => [k, v.serie]))
}

const fuerzaDe = (s: SerieHecha) => e1rm(s.kg, s.reps, 0)

function cambioDe(a: SerieHecha | null, b: SerieHecha | null): EjercicioComparado['cambio'] {
  if (!a || !b) return null
  const [fa, fb] = [fuerzaDe(a), fuerzaDe(b)]
  if (!fa) return fb > 0 ? 1 : 0
  const d = fb / fa - 1
  return d > MARGEN ? 1 : d < -MARGEN ? -1 : 0
}

/**
 * Compara dos vueltas de una misma rutina a la misma semana: `antes` (la anterior) y `ahora`. La semana es la última que
 * tienen las dos (si la de ahora va por la 4, la 4; si ya pasó de lo que duró la anterior, su última). Las medias, solo
 * con semanas enteras. null si alguna no tiene semanas.
 */
export function compararVueltas(
  antes: Mesociclo,
  ahora: Mesociclo,
  entrenos: readonly Entreno[],
  hoy: string,
  basicos: readonly string[],
): Vueltas | null {
  const [sa, sb] = [semanasDe(antes, entrenos, hoy), semanasDe(ahora, entrenos, hoy)]
  const n = Math.min(sa.length, sb.length)
  if (!n) return null
  const [wa, wb] = [sa[n - 1], sb[n - 1]]
  const cerradas = wa.enCurso || wb.enCurso ? n - 1 : n
  const carrera = { a: carreraDe(antes, sa, basicos), b: carreraDe(ahora, sb, basicos) }
  const toneladas = (s: readonly Semana[]) =>
    s.slice(0, cerradas).reduce((t, w) => t + w.entrenos.reduce((u, x) => u + toneladasDe(x), 0), 0) /
    cerradas
  // Las sesiones, en el orden de la rutina de ahora (y las que solo hiciste antes, detrás)
  const siglas = [
    ...ahora.sesiones,
    ...antes.sesiones.filter((s) => !ahora.sesiones.some((x) => x.sigla === s.sigla)),
  ]
  const tonDe = (w: Semana, sigla: string) => {
    const hechos = w.entrenos.filter((x) => x.sigla === sigla)
    return hechos.length ? hechos.reduce((t, x) => t + toneladasDe(x), 0) : null
  }
  const [ma, mb] = [mejoresDe(wa), mejoresDe(wb)]
  // Los ejercicios en el orden de la rutina de ahora; los que no están en ella, detrás
  const orden = [
    ...ahora.sesiones.flatMap((s) => s.ejercicios.map((e) => e.nombre)),
    ...mb.keys(),
    ...ma.keys(),
  ]
  const ejercicios = [...new Set(orden)]
    .filter((nombre) => ma.has(nombre) || mb.has(nombre))
    .map((nombre) => {
      const [a, b] = [ma.get(nombre) ?? null, mb.get(nombre) ?? null]
      return { nombre, a, b, cambio: cambioDe(a, b) }
    })
  const comparados = ejercicios.filter((e) => e.cambio !== null)
  return {
    semana: n,
    cerradas,
    delante: comparados.filter((e) => e.cambio === 1).length,
    comparados: comparados.length,
    carrera,
    fuerza: { a: hasta(carrera.a, n), b: hasta(carrera.b, n) },
    toneladas: cerradas ? { a: toneladas(sa), b: toneladas(sb) } : null,
    constancia: cerradas
      ? {
          a: constanciaDe(sa.slice(0, cerradas), antes.sesionesPorSemana).pct,
          b: constanciaDe(sb.slice(0, cerradas), ahora.sesionesPorSemana).pct,
        }
      : null,
    sesiones: siglas.map((s) => ({
      sigla: s.sigla,
      nombre: s.nombre,
      a: tonDe(wa, s.sigla),
      b: tonDe(wb, s.sigla),
    })),
    ejercicios,
  }
}
