// «Para esta sesión»: consejos según los ejercicios de hoy (docs/conocimiento/02-reglas.md §7; consejos-pantalla.js ·
// ygSessionKind y ygSessionRecs del prototipo). Los textos van en shared/content/tips/session.json; aquí, cuándo sale cada uno.
import type { LibraryExercise } from './exerciseLibrary.ts'
import { MUSCLES, type MuscleId } from './muscles.ts'

export type TipId =
  | 'lateralEmpuje'
  | 'lateralTiron'
  | 'lateralPorDetras'
  | 'bicepsEnEmpuje'
  | 'bicepsFaltaEnEmpuje'
  | 'tricepsEnTiron'
  | 'tricepsFaltaEnTiron'
  | 'bicepsEnTiron'
  | 'prioridadTarde'
  | 'gemelo'
  | 'coreConCarga'
  | 'coreEstabilidad'
  | 'antebrazoEnTiron'
  | 'antebrazoSinTiron'
  | 'curlFemoralYBisagra'
  | 'hackYPrensa'

/** Un texto del contenido: `ok` son los «Bien: …», que no se enseñan (como en el prototipo). */
export type TipText = { ok: boolean; text: string; why: string; source: string }

/** Lo que se arregla con un toque, solo hoy: cambiar dos ejercicios de sitio o subir uno a la siguiente posición. */
export type TipAction = { tipo: 'invertir'; a: number; b: number } | { tipo: 'subir'; indice: number }

export type SessionTip = { id: TipId; text: string; why: string; source: string; accion: TipAction | null }

type Ejercicio = Pick<LibraryExercise, 'id' | 'name' | 'primary' | 'equipment' | 'pattern'> & { sets: number }

const PUSH = new Set(['empuje_h', 'empuje_inc', 'empuje_v'])
const PULL = new Set(['traccion_v', 'traccion_h'])
const LEG = new Set(['sentadilla', 'bisagra', 'unilateral', 'empuje_cadera'])
const BISAGRAS = ['peso_muerto_rumano', 'peso_muerto_piernas_rigidas', 'peso_muerto_rumano_con_mancuernas']

/** Empuje, tirón, pierna o mixta: la que más series suma (los patrones cuentan entero; el músculo, a medias). */
export function sessionKind(ejercicios: Ejercicio[]): 'empuje' | 'tiron' | 'pierna' | 'mixta' {
  const sc = { empuje: 0, tiron: 0, pierna: 0 }
  for (const e of ejercicios) {
    const n = e.sets || 3
    if (PUSH.has(e.pattern)) sc.empuje += n
    else if (PULL.has(e.pattern)) sc.tiron += n
    else if (LEG.has(e.pattern)) sc.pierna += n
    else if (['cuadriceps', 'femoral', 'gluteo', 'aductores'].includes(e.primary)) sc.pierna += n * 0.6
    else if (['pecho', 'hombro_ant', 'hombro_lat'].includes(e.primary)) sc.empuje += n * 0.5
    else if (['dorsal', 'espalda_alta', 'hombro_post'].includes(e.primary)) sc.tiron += n * 0.5
  }
  const top = (Object.entries(sc) as [keyof typeof sc, number][]).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'mixta'
}

/**
 * Los consejos de una sesión con sus ejercicios en el orden de hoy. `prioridades` y `mantener` son los músculos que
 * elegiste (sin elegir, todos «desarrollar»). Solo salen los que piden hacer algo (no los «Bien: …»).
 */
export function sessionTips(
  ejercicios: Ejercicio[],
  textos: Record<TipId, TipText>,
  musculos: { prioridades?: MuscleId[]; mantener?: MuscleId[] } = {},
): SessionTip[] {
  const kind = sessionKind(ejercicios)
  const pri = musculos.prioridades ?? []
  const mant = musculos.mantener ?? []
  const idx = (f: (e: Ejercicio) => boolean) => ejercicios.findIndex(f)
  const has = (f: (e: Ejercicio) => boolean) => idx(f) >= 0
  const hasId = (...ids: string[]) => has((e) => ids.includes(e.id))
  const out: SessionTip[] = []
  const add = (id: TipId, accion: TipAction | null = null, huecos: Record<string, string> = {}) => {
    const t = textos[id]
    if (t.ok) return
    const text = Object.entries(huecos).reduce((s, [k, v]) => s.replace(`{${k}}`, v), t.text)
    out.push({ id, text, why: t.why, source: t.source, accion })
  }

  if (hasId('elevaciones_laterales_en_polea')) {
    if (kind === 'empuje') add('lateralEmpuje')
    else if (kind === 'tiron') add('lateralTiron')
  }
  if (
    kind === 'tiron' &&
    has((e) => e.primary === 'hombro_lat') &&
    !hasId('elevacion_lateral_en_polea_por_detras')
  )
    add('lateralPorDetras')
  if (kind === 'empuje') {
    if (has((e) => e.primary === 'biceps')) add('bicepsEnEmpuje')
    else if (!mant.includes('biceps')) add('bicepsFaltaEnEmpuje')
  }
  if (kind === 'tiron') {
    if (has((e) => e.primary === 'triceps')) add('tricepsEnTiron')
    else if (!mant.includes('triceps')) add('tricepsFaltaEnTiron')
    if (has((e) => e.primary === 'biceps')) add('bicepsEnTiron')
  }
  // Una prioridad fuera de los dos primeros (y sin otro de su músculo en ellos): subirla
  ejercicios.forEach((e, i) => {
    if (i < 2 || !pri.includes(e.primary)) return
    if (ejercicios.slice(0, 2).some((x) => x.primary === e.primary)) return
    add(
      'prioridadTarde',
      { tipo: 'subir', indice: i },
      { musculo: MUSCLES[e.primary].label, puesto: String(i + 1) },
    )
  })
  if (has((e) => e.primary === 'gemelo')) add('gemelo')
  if (has((e) => e.primary === 'core')) {
    const conCarga = has(
      (e) =>
        e.primary === 'core' &&
        (/polea|máquina/i.test(e.name) || e.equipment === 'cable' || e.equipment === 'machine'),
    )
    add(conCarga ? 'coreConCarga' : 'coreEstabilidad')
  }
  if (has((e) => e.primary === 'antebrazo')) add(kind === 'tiron' ? 'antebrazoEnTiron' : 'antebrazoSinTiron')
  const bisagra = idx((e) => BISAGRAS.includes(e.id))
  const curl = idx((e) => /curl_femoral/.test(e.id))
  if (bisagra >= 0 && curl >= 0) add('curlFemoralYBisagra', { tipo: 'invertir', a: bisagra, b: curl })
  const prensa = idx((e) => e.id === 'prensa')
  const hack = idx((e) => e.id === 'sentadilla_hack')
  if (prensa >= 0 && hack >= 0)
    add('hackYPrensa', prensa < hack ? { tipo: 'invertir', a: prensa, b: hack } : null)
  return out
}
