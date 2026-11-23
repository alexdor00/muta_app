// Lo que Progreso da a la revisión semanal de Comida (usuario, 2026-11-22: «como un entrenador real»): tus perímetros, cómo
// estás cada día (¿Cómo estás hoy?) y tu grasa estimada con tu objetivo. Se lee aquí, donde se guarda; Comida decide.
import { getDb } from '../../../shared/data/db.ts'
import { composicionDe, pesoConGrasa, semanasHasta } from '../domain/composition.ts'
import type { Sensaciones } from '../domain/feelings.ts'
import type { Medida } from '../domain/measures.ts'
import type { AjustesCuerpo } from '../state/progreso.ts'
import { AJUSTES, PERIMETROS_TIPO, SENSACIONES_TIPO } from './progress.ts'

export type CuerpoParaComida = {
  /** Tus medidas, por fecha (solo los perímetros que mediste cada día). */
  medidas: Medida[]
  /** Cómo estabas cada día que contestaste. */
  sensaciones: Sensaciones[]
  /** Tu grasa estimada (fórmula de la Marina, con tu calibración), tu objetivo y el peso que tendrías con él. */
  grasa: { actual: number; objetivo: number | null; pesoObjetivo: number | null } | null
  /** Las semanas que te quedan hasta tu objetivo de grasa a tu ritmo (null si no vas hacia él). */
  semanas: number | null
}

const porFecha = <T extends { date: string }>(xs: T[]) => [...xs].sort((a, b) => a.date.localeCompare(b.date))

/** Lee lo de tu cuerpo para la revisión. Con tu sexo, tu altura y tu peso de tendencia (los da Comida). */
export async function cuerpoParaComida(d: {
  sexo: 'hombre' | 'mujer'
  alturaCm: number
  pesoKg: number
  /** Tu ritmo real, en % del peso por semana (con signo). */
  ritmoPct: number | null
}): Promise<CuerpoParaComida> {
  const db = await getDb()
  const [m, s, a] = await Promise.all([
    db.getAllFromIndex('bodyLog', 'type', PERIMETROS_TIPO) as Promise<(Medida & { type: string })[]>,
    db.getAllFromIndex('bodyLog', 'type', SENSACIONES_TIPO) as Promise<(Sensaciones & { type: string })[]>,
    db.get('userContent', AJUSTES) as Promise<Partial<AjustesCuerpo> | undefined>,
  ])
  const medidas = porFecha(m)
  const ultima = (id: 'cuello' | 'cintura' | 'cadera') =>
    [...medidas].reverse().find((x) => x[id])?.[id] ?? null
  const c = composicionDe({
    sexo: d.sexo,
    alturaCm: d.alturaCm,
    pesoKg: d.pesoKg,
    cuello: ultima('cuello'),
    cintura: ultima('cintura'),
    cadera: ultima('cadera'),
    calibracion: a?.calibracion ?? null,
  })
  const objetivo = a?.objetivo ?? null
  const pesoObjetivo = c && objetivo ? pesoConGrasa(c.magraKg, objetivo) : null
  return {
    medidas,
    sensaciones: porFecha(s),
    grasa: c ? { actual: c.grasa, objetivo, pesoObjetivo } : null,
    semanas: pesoObjetivo && d.ritmoPct ? semanasHasta(d.pesoKg, pesoObjetivo, d.ritmoPct) : null,
  }
}
