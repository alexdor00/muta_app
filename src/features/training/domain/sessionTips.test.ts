import { describe, expect, it } from 'vitest'
import { sessionKind, sessionTips, type TipId, type TipText } from './sessionTips.ts'

type Ej = Parameters<typeof sessionKind>[0][number]
const ej = (id: string, primary: Ej['primary'], pattern: string, over: Partial<Ej> = {}): Ej => ({
  id,
  name: id,
  primary,
  pattern,
  equipment: 'barbell',
  sets: 3,
  ...over,
})

const IDS: TipId[] = [
  'lateralEmpuje',
  'lateralTiron',
  'lateralPorDetras',
  'bicepsEnEmpuje',
  'bicepsFaltaEnEmpuje',
  'tricepsEnTiron',
  'tricepsFaltaEnTiron',
  'bicepsEnTiron',
  'prioridadTarde',
  'gemelo',
  'coreConCarga',
  'coreEstabilidad',
  'antebrazoEnTiron',
  'antebrazoSinTiron',
  'curlFemoralYBisagra',
  'hackYPrensa',
]
// Textos de prueba: el id como texto; los «Bien: …» marcados como ok
const OK = new Set<TipId>(['bicepsEnEmpuje', 'tricepsEnTiron', 'antebrazoSinTiron'])
const TEXTOS = Object.fromEntries(
  IDS.map((id) => [
    id,
    {
      ok: OK.has(id),
      text: id === 'prioridadTarde' ? '{musculo} en el puesto {puesto}' : id,
      why: '',
      source: 'V1',
    },
  ]),
) as Record<TipId, TipText>
const ids = (e: Ej[], m?: Parameters<typeof sessionTips>[2]) => sessionTips(e, TEXTOS, m).map((t) => t.id)

const RUMANO = ej('peso_muerto_rumano', 'femoral', 'bisagra')
const CURL_FEMORAL = ej('curl_femoral_tumbado', 'femoral', 'aislamiento')
const PRESS = ej('press_banca', 'pecho', 'empuje_h')
const REMO = ej('remo_con_barra', 'dorsal', 'traccion_h')
const LATERAL = ej('elevaciones_laterales_en_polea', 'hombro_lat', 'aislamiento', { equipment: 'cable' })

describe('sessionKind', () => {
  it('la que más series suma; los patrones cuentan entero y el músculo a medias', () => {
    expect(sessionKind([PRESS, LATERAL])).toBe('empuje')
    expect(sessionKind([REMO, LATERAL])).toBe('tiron')
    expect(sessionKind([RUMANO, CURL_FEMORAL, PRESS])).toBe('pierna')
    expect(sessionKind([ej('crunch', 'core', 'core')])).toBe('mixta')
  })
})

describe('sessionTips', () => {
  it('la lateral en polea: por delante en empuje, por detrás en tirón (y la variante por detrás, opcional)', () => {
    expect(ids([PRESS, LATERAL])).toContain('lateralEmpuje')
    expect(ids([REMO, REMO, LATERAL])).toEqual(expect.arrayContaining(['lateralTiron', 'lateralPorDetras']))
  })
  it('bíceps en empuje y tríceps en tirón: los «Bien» no salen; si faltan, se sugieren salvo en mantener', () => {
    expect(ids([PRESS, ej('curl', 'biceps', 'aislamiento')])).not.toContain('bicepsEnEmpuje')
    expect(ids([PRESS])).toContain('bicepsFaltaEnEmpuje')
    expect(ids([PRESS], { mantener: ['biceps'] })).not.toContain('bicepsFaltaEnEmpuje')
    expect(ids([REMO, ej('curl', 'biceps', 'aislamiento')])).toEqual(
      expect.arrayContaining(['tricepsFaltaEnTiron', 'bicepsEnTiron']),
    )
  })
  it('una prioridad en el puesto 3 o después: subirla, con su músculo y su puesto en el texto', () => {
    const curl = ej('curl', 'biceps', 'aislamiento')
    const tips = sessionTips([PRESS, REMO, LATERAL, curl], TEXTOS, { prioridades: ['biceps'] })
    expect(tips.find((t) => t.id === 'prioridadTarde')).toMatchObject({
      text: 'Bíceps en el puesto 4',
      accion: { tipo: 'subir', indice: 3 },
    })
    expect(ids([curl, PRESS, REMO], { prioridades: ['biceps'] })).not.toContain('prioridadTarde')
    expect(ids([PRESS, REMO, curl])).not.toContain('prioridadTarde')
  })
  it('curl femoral y bisagra: invertirlos (la captura de B1), y el abdomen con carga', () => {
    const tips = sessionTips(
      [RUMANO, PRESS, CURL_FEMORAL, ej('crunch_en_maquina', 'core', 'core', { equipment: 'machine' })],
      TEXTOS,
    )
    expect(tips.map((t) => t.id)).toEqual(['coreConCarga', 'curlFemoralYBisagra'])
    expect(tips[1].accion).toEqual({ tipo: 'invertir', a: 0, b: 2 })
    expect(ids([ej('plancha', 'core', 'core', { equipment: 'bodyweight' })])).toEqual(['coreEstabilidad'])
  })
  it('gemelo, antebrazo y hack con prensa (la prensa, después)', () => {
    expect(ids([ej('talones', 'gemelo', 'aislamiento')])).toEqual(['gemelo'])
    expect(ids([REMO, ej('curl_muneca', 'antebrazo', 'aislamiento')])).toContain('antebrazoEnTiron')
    expect(ids([PRESS, ej('curl_muneca', 'antebrazo', 'aislamiento')])).not.toContain('antebrazoSinTiron')
    const prensa = ej('prensa', 'cuadriceps', 'sentadilla')
    const hack = ej('sentadilla_hack', 'cuadriceps', 'sentadilla')
    expect(sessionTips([prensa, hack], TEXTOS).at(-1)?.accion).toEqual({ tipo: 'invertir', a: 0, b: 1 })
    expect(sessionTips([hack, prensa], TEXTOS).at(-1)).toMatchObject({ id: 'hackYPrensa', accion: null })
  })
})
